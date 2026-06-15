import { PageHeader } from '@/components/shared/page-header';
import { CashFlowChart } from '@/features/reports/components/cash-flow-chart';
import { MonthlySummarySection } from '@/features/reports/components/monthly-summary-section';

export function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Relatórios" description="Visão geral das finanças do casal ao longo do tempo." />
      <MonthlySummarySection />
      <CashFlowChart />
    </div>
  );
}
