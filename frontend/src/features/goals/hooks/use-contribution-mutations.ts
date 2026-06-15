import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addContribution, removeContribution } from '@/features/goals/services/goals.api';
import type { CreateContributionPayload } from '@/types/goals';

// Mutations de contribuições de uma meta: ao alterar, tanto a lista de
// contribuições quanto o progresso da meta (lista de goals) precisam recarregar.
export function useContributionMutations(goalId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['goals', goalId, 'contributions'] });
    queryClient.invalidateQueries({ queryKey: ['goals'] });
  };

  const add = useMutation({
    mutationFn: (payload: CreateContributionPayload) => addContribution(goalId, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (contributionId: string) => removeContribution(goalId, contributionId),
    onSuccess: invalidate,
  });

  return { add, remove };
}
