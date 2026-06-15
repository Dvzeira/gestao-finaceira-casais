import { useState } from 'react';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthPicker } from '@/components/shared/month-picker';
import { StatCard } from '@/components/shared/stat-card';
import { ExpensesByCategoryChart } from '@/features/reports/components/expenses-by-category-chart';
import { useMonthlySummary } from '@/features/reports/hooks/use-monthly-summary';
import { formatCurrency, getCurrentMonth } from '@/lib/format';

// Resumo do mês selecionado: totais de receitas/despesas/saldo e a
// distribuição das despesas por categoria.
export function MonthlySummarySection() {
  const [month, setMonth] = useState(getCurrentMonth());

  const { data, isLoading, isError } = useMonthlySummary(`${month}-01`);

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Resumo do mês</CardTitle>
        <MonthPicker value={month} onChange={setMonth} />
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando resumo...</p>}
        {isError && <p className="text-sm text-destructive">Não foi possível carregar o resumo do mês.</p>}

        {data && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Receitas" value={formatCurrency(data.totalIncome)} icon={TrendingUp} variant="income" />
              <StatCard label="Despesas" value={formatCurrency(data.totalExpense)} icon={TrendingDown} variant="expense" />
              <StatCard
                label="Saldo"
                value={formatCurrency(data.balance)}
                icon={Wallet}
                variant={data.balance >= 0 ? 'income' : 'expense'}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Despesas por categoria</p>
              <ExpensesByCategoryChart data={data.expensesByCategory} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
