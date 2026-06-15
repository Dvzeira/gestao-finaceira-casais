import { Coins, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GoalContributionsDialog } from '@/features/goals/components/goal-contributions-dialog';
import { GoalDialog } from '@/features/goals/components/goal-dialog';
import { useGoalMutations } from '@/features/goals/hooks/use-goal-mutations';
import { useMyCouple } from '@/features/couples/hooks/use-my-couple';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Goal, GoalStatus } from '@/types/goals';

const STATUS_LABEL: Record<GoalStatus, string> = {
  IN_PROGRESS: 'Em andamento',
  ACHIEVED: 'Concluída',
  CANCELLED: 'Cancelada',
};

const STATUS_VARIANT: Record<GoalStatus, 'warning' | 'success' | 'outline'> = {
  IN_PROGRESS: 'warning',
  ACHIEVED: 'success',
  CANCELLED: 'outline',
};

interface GoalCardProps {
  goal: Goal;
}

// Exibe uma meta financeira com progresso, divisão de contribuição entre o
// casal e metas de contribuição mensal por pessoa.
export function GoalCard({ goal }: GoalCardProps) {
  const { remove } = useGoalMutations();
  const { data: couple } = useMyCouple();
  const navigate = useNavigate();

  const memberName = (userId: string) =>
    couple?.members.find((member) => member.userId === userId)?.name ?? 'Membro';

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/goals/${goal.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') navigate(`/goals/${goal.id}`);
      }}
      className="flex cursor-pointer flex-col gap-3 rounded-md border border-border p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{goal.title}</p>
            <Badge variant={STATUS_VARIANT[goal.status]}>{STATUS_LABEL[goal.status]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Meta de {formatCurrency(goal.targetAmount)} até {formatDate(goal.targetDate)}
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto" onClick={(event) => event.stopPropagation()}>
          <GoalContributionsDialog
            goal={goal}
            trigger={
              <Button variant="ghost" size="icon" aria-label="Contribuições">
                <Coins className="size-4" />
              </Button>
            }
          />
          <GoalDialog
            goal={goal}
            trigger={
              <Button variant="ghost" size="icon" aria-label="Editar meta">
                <Pencil className="size-4" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir meta"
            disabled={remove.isPending}
            onClick={() => remove.mutate(goal.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Progress value={goal.progressPercentage} />
        <p className="text-xs text-muted-foreground">
          {formatCurrency(goal.totalContributed)} de {formatCurrency(goal.targetAmount)} (
          {goal.progressPercentage.toFixed(0)}%) · faltam {formatCurrency(goal.remainingAmount)}
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {goal.splits.map((split) => (
          <span key={split.userId}>
            {memberName(split.userId)}: {split.percentage}%
          </span>
        ))}
      </div>

      {goal.status === 'IN_PROGRESS' && goal.monthlyContributionTargets.length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {goal.monthlyContributionTargets.map((target) => (
            <span key={target.userId}>
              {memberName(target.userId)}: {formatCurrency(target.amount)}/mês ({goal.monthsRemaining}{' '}
              {goal.monthsRemaining === 1 ? 'mês restante' : 'meses restantes'})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
