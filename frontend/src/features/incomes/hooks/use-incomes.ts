import { useQuery } from '@tanstack/react-query';
import { listIncomes } from '@/features/incomes/services/incomes.api';

export function useIncomes(referenceMonth?: string) {
  return useQuery({
    queryKey: ['incomes', referenceMonth],
    queryFn: () => listIncomes(referenceMonth),
  });
}
