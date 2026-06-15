import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GoalForm } from '@/features/goals/components/goal-form';
import type { Goal } from '@/types/goals';

interface GoalDialogProps {
  goal?: Goal;
  trigger: React.ReactNode;
}

// Dialog reutilizável para criar (sem `goal`) ou editar (com `goal`) uma meta financeira.
export function GoalDialog({ goal, trigger }: GoalDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!goal;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar meta' : 'Nova meta'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados da meta financeira.'
              : 'Defina uma nova meta financeira do casal.'}
          </DialogDescription>
        </DialogHeader>
        <GoalForm goal={goal} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
