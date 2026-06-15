import { PageHeader } from '@/components/shared/page-header';
import { GoalList } from '@/features/goals/components/goal-list';

export function GoalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Metas" description="Defina metas financeiras e acompanhe o progresso do casal." />
      <GoalList />
    </div>
  );
}
