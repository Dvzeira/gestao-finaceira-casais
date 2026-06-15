import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';

// Bloqueia o acesso a rotas que exigem usuário autenticado, redirecionando
// para o login quando não há sessão ativa.
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
