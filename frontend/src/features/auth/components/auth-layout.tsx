import type { ReactNode } from 'react';
import { PiggyBank } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

// Layout das páginas de autenticação: painel de marca em telas grandes e
// card de formulário centralizado (único elemento visível no mobile).
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh bg-background">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-primary to-blue-700 p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-white/15">
            <PiggyBank className="size-5" />
          </div>
          <span className="text-lg font-semibold">Gestão Financeira</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Organização e planejamento financeiro para o casal.
          </h2>
          <p className="mt-3 text-primary-foreground/80">
            Acompanhe receitas, despesas, patrimônio e metas em conjunto, com clareza sobre a
            contribuição de cada um.
          </p>
        </div>

        <p className="text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} Gestão Financeira para Casais
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center lg:hidden">
            <h1 className="text-2xl font-semibold text-foreground">Gestão Financeira para Casais</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organização e planejamento financeiro para o casal.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>

          {footer && <div className="mt-4 text-center text-sm">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
