import { useQuery } from '@tanstack/react-query';
import { listGoals } from '@/features/goals/services/goals.api';

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: listGoals,
  });
}
