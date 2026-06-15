// Tipos espelhando os DTOs do módulo `reports` do backend.

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface MonthlySummary {
  referenceMonth: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expensesByCategory: CategoryExpense[];
}

export interface CashFlowEntry {
  referenceMonth: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
