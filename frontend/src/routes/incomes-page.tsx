import { PageHeader } from '@/components/shared/page-header';
import { IncomeList } from '@/features/incomes/components/income-list';

export function IncomesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Receitas" description="Gerencie as receitas do casal mês a mês." />
      <IncomeList />
    </div>
  );
}
