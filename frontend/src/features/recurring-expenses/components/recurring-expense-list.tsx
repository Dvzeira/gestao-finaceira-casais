import { AlertCircle, Repeat } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { RecurringExpenseCard } from '@/features/recurring-expenses/components/recurring-expense-card';
import { RecurringExpenseDialog } from '@/features/recurring-expenses/components/recurring-expense-dialog';
import { useRecurringExpenses } from '@/features/recurring-expenses/hooks/use-recurring-expenses';

// Tela de despesas recorrentes: lista todas as recorrências cadastradas com
// ações de criar/editar/excluir/ativar/desativar.
export function RecurringExpenseList() {
  const { data: recurringExpenses, isLoading, isError } = useRecurringExpenses();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Despesas recorrentes</CardTitle>
        <RecurringExpenseDialog trigger={<Button>Nova recorrência</Button>} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando recorrências...</p>}
        {isError && (
          <EmptyState
            icon={AlertCircle}
            title="Não foi possível carregar as recorrências"
            description="Tente novamente mais tarde."
          />
        )}
        {!isLoading && !isError && recurringExpenses?.length === 0 && (
          <EmptyState
            icon={Repeat}
            title="Nenhuma despesa recorrente cadastrada"
            description="Cadastre despesas fixas para gerá-las automaticamente todo mês."
          />
        )}

        <div className="flex flex-col gap-2">
          {recurringExpenses?.map((recurringExpense) => (
            <RecurringExpenseCard key={recurringExpense.id} recurringExpense={recurringExpense} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
