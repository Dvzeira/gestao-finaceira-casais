import { http } from '@/lib/http';
import type { CreateIncomePayload, Income, UpdateIncomePayload } from '@/types/incomes';

export async function listIncomes(referenceMonth?: string): Promise<Income[]> {
  const { data } = await http.get<Income[]>('/incomes', {
    params: referenceMonth ? { referenceMonth } : undefined,
  });
  return data;
}

export async function createIncome(payload: CreateIncomePayload): Promise<Income> {
  const { data } = await http.post<Income>('/incomes', payload);
  return data;
}

export async function updateIncome(id: string, payload: UpdateIncomePayload): Promise<Income> {
  const { data } = await http.patch<Income>(`/incomes/${id}`, payload);
  return data;
}

export async function deleteIncome(id: string): Promise<void> {
  await http.delete(`/incomes/${id}`);
}
