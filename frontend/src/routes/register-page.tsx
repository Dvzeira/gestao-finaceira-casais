import { Link } from 'react-router-dom';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { RegisterForm } from '@/features/auth/components/register-form';

export function RegisterPage() {
  return (
    <AuthLayout
      title="Criar conta"
      description="Cadastre-se para começar a organizar as finanças do casal."
      footer={
        <span className="text-muted-foreground">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </span>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
