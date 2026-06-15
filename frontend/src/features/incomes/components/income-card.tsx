import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { IncomeDialog } from '@/features/incomes/components/income-dialog';
import { useIncomeMutations } from '@/features/incomes/hooks/use-income-mutations';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Income } from '@/types/incomes';

const INCOME_TYPE_LABEL: Record<Income['type'], string> = {
  SALARY: 'Salário',
  EXTRA: 'Extra',
};

interface IncomeCardProps {
  income: Income;
}

// Exibe uma receita em formato de linha, com ações de editar e excluir.
export function IncomeCard({ income }: IncomeCardProps) {
  const { remove } = useIncomeMutations();

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border p-3 transition-colors hover:bg-muted/50">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{income.description}</p>
        <p className="text-xs text-muted-foreground">
          {INCOME_TYPE_LABEL[income.type]} · Recebido em {formatDate(income.receivedAt)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-income">{formatCurrency(income.amount)}</span>
        <IncomeDialog
          income={income}
          trigger={
            <Button variant="ghost" size="icon" aria-label="Editar receita">
              <Pencil className="size-4" />
            </Button>
          }
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir receita"
          disabled={remove.isPending}
          onClick={() => remove.mutate(income.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
