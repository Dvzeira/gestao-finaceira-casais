import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCashFlow } from '@/features/reports/hooks/use-cash-flow';
import { formatCurrency, formatMonthYear } from '@/lib/format';

const CASH_FLOW_MONTHS = 6;

// Gráfico de barras comparando receitas e despesas dos últimos meses,
// usando a paleta semântica de receitas (verde) e despesas (vermelho).
export function CashFlowChart() {
  const { data, isLoading, isError } = useCashFlow(CASH_FLOW_MONTHS);

  const chartData = data?.map((entry) => ({
    month: formatMonthYear(entry.referenceMonth),
    Receitas: entry.totalIncome,
    Despesas: entry.totalExpense,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de caixa</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando gráfico...</p>}
        {isError && <p className="text-sm text-destructive">Não foi possível carregar o fluxo de caixa.</p>}

        {chartData && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value: number) => formatCurrency(value)}
                width={90}
              />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="Receitas" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
