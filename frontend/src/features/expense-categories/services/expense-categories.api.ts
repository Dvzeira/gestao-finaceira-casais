import { http } from '@/lib/http';
import type {
  CreateExpenseCategoryPayload,
  ExpenseCategory,
} from '@/types/expense-categories';

export async function listExpenseCategories(): Promise<ExpenseCategory[]> {
  const { data } = await http.get<ExpenseCategory[]>('/expense-categories');
  return data;
}

export async function createExpenseCategory(
  payload: CreateExpenseCategoryPayload,
): Promise<ExpenseCategory> {
  const { data } = await http.post<ExpenseCategory>('/expense-categories', payload);
  return data;
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  await http.delete(`/expense-categories/${id}`);
}
