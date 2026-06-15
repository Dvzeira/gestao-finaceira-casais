import { Link } from 'react-router-dom';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { LoginForm } from '@/features/auth/components/login-form';

export function LoginPage() {
  return (
    <AuthLayout
      title="Entrar"
      description="Acesse sua conta para continuar."
      footer={
        <span className="text-muted-foreground">
          Não tem uma conta?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </span>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
