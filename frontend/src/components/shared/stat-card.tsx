import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardVariant = 'income' | 'expense' | 'goal' | 'primary' | 'neutral';

const VARIANT_STYLES: Record<StatCardVariant, string> = {
  income: 'bg-income/10 text-income',
  expense: 'bg-expense/10 text-expense',
  goal: 'bg-goal/10 text-goal',
  primary: 'bg-primary/10 text-primary',
  neutral: 'bg-muted text-muted-foreground',
};

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  variant?: StatCardVariant;
  className?: string;
}

// Card de indicador reutilizável (dashboard e relatórios): ícone em destaque + label + valor.
export function StatCard({ label, value, icon: Icon, variant = 'neutral', className }: StatCardProps) {
  return (
    <Card className={cn('gap-3 py-5', className)}>
      <CardContent className="flex items-center gap-4">
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', VARIANT_STYLES[variant])}>
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <span className="truncate text-sm text-muted-foreground">{label}</span>
          <span className="truncate text-xl font-semibold text-foreground">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}
