import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createRecurringExpense,
  deleteRecurringExpense,
  updateRecurringExpense,
} from '@/features/recurring-expenses/services/recurring-expenses.api';
import type { UpdateRecurringExpensePayload } from '@/types/recurring-expenses';

export function useRecurringExpenseMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });

  const create = useMutation({
    mutationFn: createRecurringExpense,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRecurringExpensePayload }) =>
      updateRecurringExpense(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteRecurringExpense,
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
