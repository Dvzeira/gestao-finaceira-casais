import { useQuery } from '@tanstack/react-query';
import { getMonthlySummary } from '@/features/reports/services/reports.api';

export function useMonthlySummary(referenceMonth?: string) {
  return useQuery({
    queryKey: ['reports', 'monthly-summary', referenceMonth],
    queryFn: () => getMonthlySummary(referenceMonth),
  });
}
