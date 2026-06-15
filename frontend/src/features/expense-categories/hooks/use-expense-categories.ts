import { useQuery } from '@tanstack/react-query';
import { listExpenseCategories } from '@/features/expense-categories/services/expense-categories.api';

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: listExpenseCategories,
  });
}
