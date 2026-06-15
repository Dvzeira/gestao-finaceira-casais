import { useQuery } from '@tanstack/react-query';
import { getCashFlow } from '@/features/reports/services/reports.api';

export function useCashFlow(months?: number) {
  return useQuery({
    queryKey: ['reports', 'cash-flow', months],
    queryFn: () => getCashFlow(months),
  });
}
