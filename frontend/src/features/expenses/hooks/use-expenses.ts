import { useQuery } from '@tanstack/react-query';
import { listExpenses } from '@/features/expenses/services/expenses.api';
import type { ExpenseStatus } from '@/types/expenses';

export function useExpenses(referenceMonth?: string, status?: ExpenseStatus) {
  return useQuery({
    queryKey: ['expenses', referenceMonth, status],
    queryFn: () => listExpenses({ referenceMonth, status }),
  });
}
