import { CheckCircle2, Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useExpenseCategories } from '@/features/expense-categories/hooks/use-expense-categories';
import { ExpenseDialog } from '@/features/expenses/components/expense-dialog';
import { useExpenseMutations } from '@/features/expenses/hooks/use-expense-mutations';
import { useMyCouple } from '@/features/couples/hooks/use-my-couple';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Expense, ExpenseStatus } from '@/types/expenses';

const STATUS_LABEL: Record<ExpenseStatus, string> = {
  PENDING: 'Pendente',
  PAID: 'Paga',
  OVERDUE: 'Atrasada',
};

const STATUS_VARIANT: Record<ExpenseStatus, 'warning' | 'success' | 'destructive'> = {
  PENDING: 'warning',
  PAID: 'success',
  OVERDUE: 'destructive',
};

interface ExpenseCardProps {
  expense: Expense;
}

// Exibe uma despesa em formato de linha, com categoria, divisão, status e
// ações de marcar como paga, editar e excluir.
export function ExpenseCard({ expense }: ExpenseCardProps) {
  const { remove, update } = useExpenseMutations();
  const { data: categories } = useExpenseCategories();
  const { data: couple } = useMyCouple();

  const category = categories?.find((item) => item.id === expense.categoryId);
  const owner = couple?.members.find((member) => member.userId === expense.ownerUserId);

  const ownershipLabel =
    expense.ownership === 'INDIVIDUAL'
      ? `Individual · ${owner?.name ?? 'Responsável'}`
      : `Compartilhada · ${expense.sharedSplitPercentageA ?? 0}% / ${expense.sharedSplitPercentageB ?? 0}%`;

  const installmentLabel = expense.isInstallment
    ? ` · Parcela ${expense.installmentNumber}/${expense.installmentTotal}`
    : '';

  function handleMarkAsPaid() {
    update.mutate({
      id: expense.id,
      payload: { status: 'PAID', paidAt: new Date().toISOString().slice(0, 10) },
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{expense.description}</p>
          <Badge variant={STATUS_VARIANT[expense.status]}>{STATUS_LABEL[expense.status]}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {category?.name ?? 'Sem categoria'} · Vence em {formatDate(expense.dueDate)} ·{' '}
          {ownershipLabel}
          {installmentLabel}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <span className="text-base font-semibold text-expense">{formatCurrency(expense.amount)}</span>
        {expense.status !== 'PAID' && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Marcar como paga"
            disabled={update.isPending}
            onClick={handleMarkAsPaid}
          >
            <CheckCircle2 className="size-4" />
          </Button>
        )}
        <ExpenseDialog
          expense={expense}
          trigger={
            <Button variant="ghost" size="icon" aria-label="Editar despesa">
              <Pencil className="size-4" />
            </Button>
          }
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir despesa"
          disabled={remove.isPending}
          onClick={() => remove.mutate(expense.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
