import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createExpense,
  deleteExpense,
  updateExpense,
} from '@/features/expenses/services/expenses.api';
import type { UpdateExpensePayload } from '@/types/expenses';

// Agrupa as mutations de despesas para reaproveitar a invalidação de cache,
// que precisa recarregar a lista para qualquer mês/status exibido.
export function useExpenseMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['expenses'] });

  const create = useMutation({
    mutationFn: createExpense,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateExpensePayload }) =>
      updateExpense(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteExpense,
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
