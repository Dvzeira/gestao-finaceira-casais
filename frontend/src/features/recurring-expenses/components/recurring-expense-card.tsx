import { Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useExpenseCategories } from '@/features/expense-categories/hooks/use-expense-categories';
import { RecurringExpenseDialog } from '@/features/recurring-expenses/components/recurring-expense-dialog';
import { useRecurringExpenseMutations } from '@/features/recurring-expenses/hooks/use-recurring-expense-mutations';
import { useMyCouple } from '@/features/couples/hooks/use-my-couple';
import { formatCurrency, formatDate } from '@/lib/format';
import type { RecurringExpense, RecurringFrequency } from '@/types/recurring-expenses';

const FREQUENCY_LABEL: Record<RecurringFrequency, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
};

interface RecurringExpenseCardProps {
  recurringExpense: RecurringExpense;
}

// Exibe uma despesa recorrente em formato de linha, com frequência, divisão
// e ações de ativar/desativar, editar e excluir.
export function RecurringExpenseCard({ recurringExpense }: RecurringExpenseCardProps) {
  const { remove, update } = useRecurringExpenseMutations();
  const { data: categories } = useExpenseCategories();
  const { data: couple } = useMyCouple();

  const category = categories?.find((item) => item.id === recurringExpense.categoryId);
  const owner = couple?.members.find((member) => member.userId === recurringExpense.ownerUserId);

  const ownershipLabel =
    recurringExpense.ownership === 'INDIVIDUAL'
      ? `Individual · ${owner?.name ?? 'Responsável'}`
      : `Compartilhada · ${recurringExpense.sharedSplitPercentageA ?? 0}% / ${recurringExpense.sharedSplitPercentageB ?? 0}%`;

  const frequencyLabel =
    recurringExpense.frequency === 'WEEKLY'
      ? FREQUENCY_LABEL.WEEKLY
      : `${FREQUENCY_LABEL[recurringExpense.frequency]} · dia ${recurringExpense.dayOfMonth}`;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {recurringExpense.templateDescription}
          </p>
          <Badge variant={recurringExpense.active ? 'success' : 'outline'}>
            {recurringExpense.active ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {category?.name ?? 'Sem categoria'} · {frequencyLabel} · {ownershipLabel} · desde{' '}
          {formatDate(recurringExpense.startDate)}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <span className="text-base font-semibold text-expense">
          {formatCurrency(recurringExpense.amount)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({
              id: recurringExpense.id,
              payload: { active: !recurringExpense.active },
            })
          }
        >
          {recurringExpense.active ? 'Desativar' : 'Ativar'}
        </Button>
        <RecurringExpenseDialog
          recurringExpense={recurringExpense}
          trigger={
            <Button variant="ghost" size="icon" aria-label="Editar recorrência">
              <Pencil className="size-4" />
            </Button>
          }
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir recorrência"
          disabled={remove.isPending}
          onClick={() => remove.mutate(recurringExpense.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
