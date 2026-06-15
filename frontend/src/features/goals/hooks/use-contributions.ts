import { useQuery } from '@tanstack/react-query';
import { listContributions } from '@/features/goals/services/goals.api';

export function useContributions(goalId: string, enabled = true) {
  return useQuery({
    queryKey: ['goals', goalId, 'contributions'],
    queryFn: () => listContributions(goalId),
    enabled,
  });
}
