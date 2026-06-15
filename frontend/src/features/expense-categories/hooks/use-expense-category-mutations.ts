import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createExpenseCategory,
  deleteExpenseCategory,
} from '@/features/expense-categories/services/expense-categories.api';

export function useExpenseCategoryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['expense-categories'] });

  const create = useMutation({
    mutationFn: createExpenseCategory,
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteExpenseCategory,
    onSuccess: invalidate,
  });

  return { create, remove };
}
