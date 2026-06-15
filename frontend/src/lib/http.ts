import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AuthTokens } from '@/types/auth';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/token-storage';

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

// Cliente HTTP principal: injeta o access token e tenta renovar a sessão
// via refresh token quando uma requisição retorna 401.
export const http = axios.create({
  baseURL: API_URL,
});

// Instância separada (sem interceptors) para chamar /auth/refresh sem
// disparar o próprio interceptor de 401, evitando loop infinito.
const refreshClient = axios.create({
  baseURL: API_URL,
});

http.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('Sessão expirada.');
  }

  const { data } = await refreshClient.post<AuthTokens>('/auth/refresh', {
    refreshToken,
  });
  setTokens(data);
  return data.accessToken;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      !getRefreshToken()
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const accessToken = await refreshPromise;
      originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
      return http(originalRequest);
    } catch (refreshError) {
      clearTokens();
      return Promise.reject(refreshError);
    }
  },
);
