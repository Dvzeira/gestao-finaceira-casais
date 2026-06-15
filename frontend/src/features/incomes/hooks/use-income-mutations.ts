import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createIncome,
  deleteIncome,
  updateIncome,
} from '@/features/incomes/services/incomes.api';
import type { UpdateIncomePayload } from '@/types/incomes';

// Agrupa as mutations de receitas para reaproveitar a invalidação de cache,
// que precisa recarregar a lista para qualquer mês exibido.
export function useIncomeMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['incomes'] });

  const create = useMutation({
    mutationFn: createIncome,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateIncomePayload }) =>
      updateIncome(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteIncome,
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
