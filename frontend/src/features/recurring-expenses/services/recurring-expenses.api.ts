import { http } from '@/lib/http';
import type {
  CreateRecurringExpensePayload,
  RecurringExpense,
  UpdateRecurringExpensePayload,
} from '@/types/recurring-expenses';

export async function listRecurringExpenses(): Promise<RecurringExpense[]> {
  const { data } = await http.get<RecurringExpense[]>('/recurring-expenses');
  return data;
}

export async function createRecurringExpense(
  payload: CreateRecurringExpensePayload,
): Promise<RecurringExpense> {
  const { data } = await http.post<RecurringExpense>('/recurring-expenses', payload);
  return data;
}

export async function updateRecurringExpense(
  id: string,
  payload: UpdateRecurringExpensePayload,
): Promise<RecurringExpense> {
  const { data } = await http.patch<RecurringExpense>(`/recurring-expenses/${id}`, payload);
  return data;
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  await http.delete(`/recurring-expenses/${id}`);
}
