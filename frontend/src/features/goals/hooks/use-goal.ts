import { useQuery } from '@tanstack/react-query';
import { getGoal } from '@/features/goals/services/goals.api';

export function useGoal(id: string) {
  return useQuery({
    queryKey: ['goals', id],
    queryFn: () => getGoal(id),
  });
}
