import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGoal, deleteGoal, updateGoal } from '@/features/goals/services/goals.api';
import type { UpdateGoalPayload } from '@/types/goals';

export function useGoalMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['goals'] });

  const create = useMutation({
    mutationFn: createGoal,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGoalPayload }) =>
      updateGoal(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteGoal,
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
