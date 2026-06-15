import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { formatCurrency } from '@/lib/format';
import type { CategoryExpense } from '@/types/reports';

// Paleta consistente com as cores semânticas do projeto, com variações para
// distinguir as categorias de despesas no gráfico.
const CATEGORY_COLORS = [
  '#dc2626',
  '#f97316',
  '#facc15',
  '#16a34a',
  '#0891b2',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#78716c',
  '#64748b',
];

interface ExpensesByCategoryChartProps {
  data: CategoryExpense[];
}

// Gráfico de pizza com a distribuição das despesas do mês por categoria.
export function ExpensesByCategoryChart({ data }: ExpensesByCategoryChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma despesa registrada neste mês.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="categoryName"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }: { name?: string; percent?: number }) =>
            `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
          }
        >
          {data.map((entry, index) => (
            <Cell key={entry.categoryId} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
