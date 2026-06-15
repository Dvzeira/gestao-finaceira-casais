import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { decodeJwtPayload } from '@/lib/jwt';
import { clearTokens, getAccessToken, setTokens } from '@/lib/token-storage';
import * as authApi from '@/features/auth/services/auth.api';
import type { LoginPayload, RegisterPayload } from '@/types/auth';

interface AccessTokenPayload {
  sub: string;
}

export interface AuthContextValue {
  userId: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function getUserIdFromToken(token: string | null): string | null {
  if (!token) {
    return null;
  }
  return decodeJwtPayload<AccessTokenPayload>(token)?.sub ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() =>
    getUserIdFromToken(getAccessToken()),
  );

  const login = useCallback(async (payload: LoginPayload) => {
    const tokens = await authApi.login(payload);
    setTokens(tokens);
    setUserId(getUserIdFromToken(tokens.accessToken));
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const tokens = await authApi.register(payload);
    setTokens(tokens);
    setUserId(getUserIdFromToken(tokens.accessToken));
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUserId(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      userId,
      isAuthenticated: userId !== null,
      login,
      register,
      logout,
    }),
    [userId, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
