// Tipos espelhando os DTOs do módulo `expense-categories` do backend.

export interface ExpenseCategory {
  id: string;
  coupleId: string | null;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface CreateExpenseCategoryPayload {
  name: string;
  icon?: string;
  color?: string;
}
