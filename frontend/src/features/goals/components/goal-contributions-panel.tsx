import { Coins, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { GoalContributionForm } from '@/features/goals/components/goal-contribution-form';
import { useContributionMutations } from '@/features/goals/hooks/use-contribution-mutations';
import { useContributions } from '@/features/goals/hooks/use-contributions';
import { useMyCouple } from '@/features/couples/hooks/use-my-couple';
import { formatCurrency, formatDate } from '@/lib/format';

interface GoalContributionsPanelProps {
  goalId: string;
}

// Histórico de contribuições da meta em formato de linha do tempo, com
// formulário para registrar novas contribuições e ação de remover.
export function GoalContributionsPanel({ goalId }: GoalContributionsPanelProps) {
  const { data: contributions, isLoading, isError } = useContributions(goalId);
  const { remove } = useContributionMutations(goalId);
  const { data: couple } = useMyCouple();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribuições</CardTitle>
        <CardDescription>Histórico de aportes feitos para esta meta.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="rounded-xl border border-dashed border-border p-4">
          <GoalContributionForm goalId={goalId} onSuccess={() => {}} />
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando contribuições...</p>}
        {isError && (
          <p className="text-sm text-destructive">Não foi possível carregar as contribuições.</p>
        )}
        {!isLoading && !isError && contributions?.length === 0 && (
          <EmptyState
            icon={Coins}
            title="Nenhuma contribuição registrada"
            description="Registre o primeiro aporte para começar a acompanhar o progresso."
          />
        )}

        {contributions && contributions.length > 0 && (
          <ol className="flex flex-col gap-0">
            {contributions.map((contribution, index) => {
              const member = couple?.members.find((item) => item.userId === contribution.userId);
              const isLast = index === contributions.length - 1;

              return (
                <li key={contribution.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {!isLast && (
                    <span className="absolute top-3 left-[5px] h-full w-px bg-border" aria-hidden="true" />
                  )}
                  <span className="relative z-10 mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-card bg-goal" />

                  <div className="flex flex-1 items-start justify-between gap-4 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/40">
                    <div className="min-w-0">
                      <p className="font-display text-base font-semibold tabular-nums text-foreground">
                        {formatCurrency(contribution.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member?.name ?? 'Membro'} · {formatDate(contribution.contributedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover contribuição"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(contribution.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
