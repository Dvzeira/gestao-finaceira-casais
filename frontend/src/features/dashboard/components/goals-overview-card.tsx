import { Target } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { Progress } from '@/components/ui/progress';
import { useGoals } from '@/features/goals/hooks/use-goals';
import { formatCurrency } from '@/lib/format';

// Visão resumida das metas em andamento no dashboard, com progresso de cada uma.
export function GoalsOverviewCard() {
  const { data: goals, isLoading, isError } = useGoals();

  const activeGoals = goals?.filter((goal) => goal.status === 'IN_PROGRESS') ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metas em andamento</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando metas...</p>}
        {isError && <p className="text-sm text-destructive">Não foi possível carregar as metas.</p>}
        {!isLoading && !isError && activeGoals.length === 0 && (
          <EmptyState
            icon={Target}
            title="Nenhuma meta em andamento"
            description="Crie uma meta financeira para acompanhar o progresso aqui."
          />
        )}

        {activeGoals.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="flex flex-col gap-2 rounded-md border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-foreground">{goal.title}</p>
                  <span className="text-xs text-muted-foreground">{goal.progressPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={goal.progressPercentage} />
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(goal.totalContributed)} de {formatCurrency(goal.targetAmount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
