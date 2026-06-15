import { useState } from 'react';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthPicker } from '@/components/shared/month-picker';
import { StatCard } from '@/components/shared/stat-card';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';
import { useIncomes } from '@/features/incomes/hooks/use-incomes';
import { formatCurrency, getCurrentMonth } from '@/lib/format';

// Resumo financeiro do mês: total de receitas, despesas e saldo (receitas - despesas).
export function FinancialSummaryCard() {
  const [month, setMonth] = useState(getCurrentMonth());

  const { data: incomes, isLoading: isLoadingIncomes } = useIncomes(`${month}-01`);
  const { data: expenses, isLoading: isLoadingExpenses } = useExpenses(`${month}-01`);

  const totalIncome = incomes?.reduce((sum, income) => sum + income.amount, 0) ?? 0;
  const totalExpense = expenses?.reduce((sum, expense) => sum + expense.amount, 0) ?? 0;
  const balance = totalIncome - totalExpense;
  const isLoading = isLoadingIncomes || isLoadingExpenses;

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Resumo financeiro</CardTitle>
        <MonthPicker value={month} onChange={setMonth} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando resumo...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Receitas" value={formatCurrency(totalIncome)} icon={TrendingUp} variant="income" />
            <StatCard label="Despesas" value={formatCurrency(totalExpense)} icon={TrendingDown} variant="expense" />
            <StatCard
              label="Saldo"
              value={formatCurrency(balance)}
              icon={Wallet}
              variant={balance >= 0 ? 'income' : 'expense'}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
