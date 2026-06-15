import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { IncomeForm } from '@/features/incomes/components/income-form';
import type { Income } from '@/types/incomes';

interface IncomeDialogProps {
  income?: Income;
  trigger: React.ReactNode;
}

// Dialog reutilizável para criar (sem `income`) ou editar (com `income`) uma receita.
export function IncomeDialog({ income, trigger }: IncomeDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!income;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar receita' : 'Nova receita'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados da receita.'
              : 'Registre uma nova receita do casal.'}
          </DialogDescription>
        </DialogHeader>
        <IncomeForm income={income} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
