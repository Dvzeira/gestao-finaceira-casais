import { useState } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { MonthPicker } from '@/components/shared/month-picker';
import { IncomeCard } from '@/features/incomes/components/income-card';
import { IncomeDialog } from '@/features/incomes/components/income-dialog';
import { useIncomes } from '@/features/incomes/hooks/use-incomes';
import { formatCurrency, getCurrentMonth } from '@/lib/format';

// Tela principal de receitas: filtro por mês, total do mês e lista de
// receitas com ações de criar/editar/excluir.
export function IncomeList() {
  const [month, setMonth] = useState(getCurrentMonth());
  const { data: incomes, isLoading, isError } = useIncomes(`${month}-01`);

  const total = incomes?.reduce((sum, income) => sum + income.amount, 0) ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Receitas</CardTitle>
        <div className="flex items-center gap-3">
          <MonthPicker value={month} onChange={setMonth} />
          <IncomeDialog trigger={<Button>Nova receita</Button>} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Total do mês: <span className="font-semibold text-income">{formatCurrency(total)}</span>
        </p>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando receitas...</p>}
        {isError && (
          <EmptyState
            icon={AlertCircle}
            title="Não foi possível carregar as receitas"
            description="Tente novamente mais tarde."
          />
        )}
        {!isLoading && !isError && incomes?.length === 0 && (
          <EmptyState
            icon={Inbox}
            title="Nenhuma receita registrada"
            description="Adicione uma receita para este mês usando o botão acima."
          />
        )}

        <div className="flex flex-col gap-2">
          {incomes?.map((income) => <IncomeCard key={income.id} income={income} />)}
        </div>
      </CardContent>
    </Card>
  );
}
