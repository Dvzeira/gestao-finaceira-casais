import { AlertCircle, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { GoalCard } from '@/features/goals/components/goal-card';
import { GoalDialog } from '@/features/goals/components/goal-dialog';
import { useGoals } from '@/features/goals/hooks/use-goals';

// Tela principal de metas: lista as metas financeiras do casal com progresso
// e ações de criar/editar/excluir e registrar contribuições.
export function GoalList() {
  const { data: goals, isLoading, isError } = useGoals();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Metas</CardTitle>
        <GoalDialog trigger={<Button>Nova meta</Button>} />
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando metas...</p>}
        {isError && (
          <EmptyState
            icon={AlertCircle}
            title="Não foi possível carregar as metas"
            description="Tente novamente mais tarde."
          />
        )}
        {!isLoading && !isError && goals?.length === 0 && (
          <EmptyState
            icon={Target}
            title="Nenhuma meta cadastrada"
            description="Crie uma meta financeira para começar a acompanhar o progresso."
          />
        )}

        {goals && goals.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
