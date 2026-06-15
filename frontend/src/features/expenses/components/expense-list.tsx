import { useState } from 'react';
import { AlertCircle, Receipt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import { MonthPicker } from '@/components/shared/month-picker';
import { ExpenseCard } from '@/features/expenses/components/expense-card';
import { ExpenseDialog } from '@/features/expenses/components/expense-dialog';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';
import { formatCurrency, getCurrentMonth } from '@/lib/format';
import type { ExpenseStatus } from '@/types/expenses';

const STATUS_OPTIONS: Array<{ value: ExpenseStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'PAID', label: 'Pagas' },
  { value: 'OVERDUE', label: 'Atrasadas' },
];

// Tela principal de despesas: filtro por mês e status, total do mês e lista
// de despesas com ações de criar/editar/excluir/marcar como paga.
export function ExpenseList() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [status, setStatus] = useState<ExpenseStatus | 'ALL'>('ALL');

  const { data: expenses, isLoading, isError } = useExpenses(
    `${month}-01`,
    status === 'ALL' ? undefined : status,
  );

  const total = expenses?.reduce((sum, expense) => sum + expense.amount, 0) ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <CardTitle>Despesas</CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          <MonthPicker value={month} onChange={setMonth} />
          <Select value={status} onValueChange={(value) => setStatus(value as ExpenseStatus | 'ALL')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExpenseDialog trigger={<Button>Nova despesa</Button>} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Total do mês: <span className="font-semibold text-expense">{formatCurrency(total)}</span>
        </p>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando despesas...</p>}
        {isError && (
          <EmptyState
            icon={AlertCircle}
            title="Não foi possível carregar as despesas"
            description="Tente novamente mais tarde."
          />
        )}
        {!isLoading && !isError && expenses?.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="Nenhuma despesa encontrada"
            description="Ajuste os filtros ou adicione uma nova despesa para este mês."
          />
        )}

        <div className="flex flex-col gap-2">
          {expenses?.map((expense) => <ExpenseCard key={expense.id} expense={expense} />)}
        </div>
      </CardContent>
    </Card>
  );
}
