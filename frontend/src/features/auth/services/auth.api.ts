import { http } from '@/lib/http';
import type {
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
} from '@/types/auth';

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await http.post<AuthTokens>('/auth/login', payload);
  return data;
}

export async function register(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  const { data } = await http.post<RegisterResponse>('/auth/register', payload);
  return data;
}
