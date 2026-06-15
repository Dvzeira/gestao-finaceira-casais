import { http } from '@/lib/http';
import type { CreateExpensePayload, Expense, ExpenseStatus, UpdateExpensePayload } from '@/types/expenses';

interface ListExpensesParams {
  referenceMonth?: string;
  status?: ExpenseStatus;
}

export async function listExpenses(params: ListExpensesParams = {}): Promise<Expense[]> {
  const { data } = await http.get<Expense[]>('/expenses', { params });
  return data;
}

// Despesas parceladas criam várias parcelas de uma vez, por isso o backend
// retorna um array mesmo na criação.
export async function createExpense(payload: CreateExpensePayload): Promise<Expense[]> {
  const { data } = await http.post<Expense[]>('/expenses', payload);
  return data;
}

export async function updateExpense(id: string, payload: UpdateExpensePayload): Promise<Expense> {
  const { data } = await http.patch<Expense>(`/expenses/${id}`, payload);
  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  await http.delete(`/expenses/${id}`);
}
