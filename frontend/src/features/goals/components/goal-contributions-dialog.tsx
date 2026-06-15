import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GoalContributionForm } from '@/features/goals/components/goal-contribution-form';
import { useContributionMutations } from '@/features/goals/hooks/use-contribution-mutations';
import { useContributions } from '@/features/goals/hooks/use-contributions';
import { useMyCouple } from '@/features/couples/hooks/use-my-couple';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Goal } from '@/types/goals';

interface GoalContributionsDialogProps {
  goal: Goal;
  trigger: React.ReactNode;
}

// Dialog que lista as contribuições de uma meta e permite registrar ou
// remover contribuições dos membros do casal.
export function GoalContributionsDialog({ goal, trigger }: GoalContributionsDialogProps) {
  const { data: contributions, isLoading, isError } = useContributions(goal.id);
  const { remove } = useContributionMutations(goal.id);
  const { data: couple } = useMyCouple();

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contribuições · {goal.title}</DialogTitle>
          <DialogDescription>
            Registre ou remova contribuições para esta meta.
          </DialogDescription>
        </DialogHeader>

        <GoalContributionForm goalId={goal.id} onSuccess={() => {}} />

        <div className="flex flex-col gap-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando contribuições...</p>}
          {isError && (
            <p className="text-sm text-destructive">Não foi possível carregar as contribuições.</p>
          )}
          {!isLoading && contributions?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma contribuição registrada.</p>
          )}

          {contributions?.map((contribution) => {
            const member = couple?.members.find((item) => item.userId === contribution.userId);
            return (
              <div
                key={contribution.id}
                className="flex items-center justify-between gap-4 rounded-md border border-border p-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
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
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
