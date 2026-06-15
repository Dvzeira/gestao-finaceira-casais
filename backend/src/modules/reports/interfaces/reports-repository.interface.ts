// Contrato de persistência para agregações usadas nos relatórios financeiros
// do casal. Implementado por ReportsRepository (Prisma) e injetado via token
// REPORTS_REPOSITORY, permitindo mocks em testes.

export interface CategoryExpenseTotal {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface MonthlyTotals {
  referenceMonth: Date;
  totalIncome: number;
  totalExpense: number;
}

export const REPORTS_REPOSITORY = Symbol('REPORTS_REPOSITORY');

export interface IReportsRepository {
  // Soma das receitas do casal cujo referenceMonth é o mês informado.
  sumIncomeByMonth(coupleId: string, month: Date): Promise<number>;
  // Soma das despesas do casal com dueDate dentro do mês informado.
  sumExpensesByMonth(coupleId: string, month: Date): Promise<number>;
  // Total de despesas do mês agrupado por categoria.
  getExpensesByCategory(
    coupleId: string,
    month: Date,
  ): Promise<CategoryExpenseTotal[]>;
}
