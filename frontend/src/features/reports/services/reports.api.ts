import { http } from '@/lib/http';
import type { CashFlowEntry, MonthlySummary } from '@/types/reports';

export async function getMonthlySummary(referenceMonth?: string): Promise<MonthlySummary> {
  const { data } = await http.get<MonthlySummary>('/reports/monthly-summary', {
    params: referenceMonth ? { referenceMonth } : undefined,
  });
  return data;
}

export async function getCashFlow(months?: number): Promise<CashFlowEntry[]> {
  const { data } = await http.get<CashFlowEntry[]>('/reports/cash-flow', {
    params: months ? { months } : undefined,
  });
  return data;
}
