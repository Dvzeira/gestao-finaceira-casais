import { Link, Navigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';
import { GoalDetail } from '@/features/goals/components/goal-detail';
import { useGoal } from '@/features/goals/hooks/use-goal';

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/goals" replace />;
  }

  return <GoalDetailContent id={id} />;
}

function GoalDetailContent({ id }: { id: string }) {
  const { data: goal, isLoading, isError } = useGoal(id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando meta...</p>;
  }

  if (isError || !goal) {
    return (
      <div className="flex flex-col gap-4">
        <Link to="/goals" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Voltar para metas
        </Link>
        <EmptyState
          icon={AlertCircle}
          title="Não foi possível carregar esta meta"
          description="Ela pode ter sido removida ou você não tem acesso a ela."
        />
      </div>
    );
  }

  return <GoalDetail goal={goal} />;
}
