import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarClock, PiggyBank, Pencil, Target, Trash2, Wallet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/stat-card';
import { GoalContributionsPanel } from '@/features/goals/components/goal-contributions-panel';
import { GoalDialog } from '@/features/goals/components/goal-dialog';
import { GoalMemberSplitCard } from '@/features/goals/components/goal-member-split-card';
import { GoalProgressRing } from '@/features/goals/components/goal-progress-ring';
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

interface GoalDetailProps {
  goal: Goal;
}

// Página de detalhe de uma meta financeira: visão aprofundada do progresso,
// divisão de contribuição entre o casal e histórico de aportes.
export function GoalDetail({ goal }: GoalDetailProps) {
  const { data: couple } = useMyCouple();
  const { remove } = useGoalMutations();
  const navigate = useNavigate();

  const memberName = (userId: string) =>
    couple?.members.find((member) => member.userId === userId)?.name ?? 'Membro';

  async function handleDelete() {
    await remove.mutateAsync(goal.id);
    navigate('/goals');
  }

  const monthsLabel =
    goal.monthsRemaining === 1 ? '1 mês restante' : `${goal.monthsRemaining} meses restantes`;

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/goals"
        className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors animate-fade-up hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para metas
      </Link>

      {/* Hero: identidade da meta + anel de progresso */}
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 animate-fade-up sm:p-8"
        style={{ animationDelay: '60ms' }}
      >
        <div
          className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-goal/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-16 size-72 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3">
            <Badge variant={STATUS_VARIANT[goal.status]} className="w-fit">
              {STATUS_LABEL[goal.status]}
            </Badge>
            <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              {goal.title}
            </h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Target className="size-4" />
                Meta de {formatCurrency(goal.targetAmount)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-4" />
                até {formatDate(goal.targetDate)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <GoalDialog
                goal={goal}
                trigger={
                  <Button variant="outline" size="sm">
                    <Pencil className="size-4" />
                    Editar meta
                  </Button>
                }
              />
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={remove.isPending}
                onClick={handleDelete}
              >
                <Trash2 className="size-4" />
                Excluir
              </Button>
            </div>
          </div>

          <GoalProgressRing
            value={goal.progressPercentage}
            label={`${goal.progressPercentage.toFixed(0)}%`}
            sublabel="concluído"
          />
        </div>
      </div>

      {/* Visão geral em números */}
      <div className="grid grid-cols-1 gap-4 animate-fade-up sm:grid-cols-3" style={{ animationDelay: '120ms' }}>
        <StatCard
          label="Já investido"
          value={formatCurrency(goal.totalContributed)}
          icon={Wallet}
          variant="income"
        />
        <StatCard
          label="Falta investir"
          value={formatCurrency(goal.remainingAmount)}
          icon={PiggyBank}
          variant="goal"
        />
        <StatCard
          label="Prazo"
          value={goal.status === 'IN_PROGRESS' ? monthsLabel : formatDate(goal.targetDate)}
          icon={CalendarClock}
          variant="primary"
        />
      </div>

      {/* Divisão de contribuição entre o casal */}
      {goal.splits.length > 0 && (
        <div className="flex flex-col gap-3 animate-fade-up" style={{ animationDelay: '180ms' }}>
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-xl font-semibold text-foreground">Divisão da meta</h2>
            <p className="text-sm text-muted-foreground">
              Percentual de contribuição e meta mensal de cada pessoa para alcançar o objetivo no prazo.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {goal.splits.map((split, index) => {
              const target = goal.monthlyContributionTargets.find(
                (item) => item.userId === split.userId,
              );

              return (
                <GoalMemberSplitCard
                  key={split.userId}
                  name={memberName(split.userId)}
                  percentage={split.percentage}
                  monthlyAmount={goal.status === 'IN_PROGRESS' ? target?.amount : undefined}
                  accent={index % 2 === 0 ? 'primary' : 'goal'}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Histórico de contribuições */}
      <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
        <GoalContributionsPanel goalId={goal.id} />
      </div>
    </div>
  );
}
