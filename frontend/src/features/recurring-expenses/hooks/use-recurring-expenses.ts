import { useQuery } from '@tanstack/react-query';
import { listRecurringExpenses } from '@/features/recurring-expenses/services/recurring-expenses.api';

export function useRecurringExpenses() {
  return useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: listRecurringExpenses,
  });
}
