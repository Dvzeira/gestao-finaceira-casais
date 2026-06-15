import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RecurringExpenseForm } from '@/features/recurring-expenses/components/recurring-expense-form';
import type { RecurringExpense } from '@/types/recurring-expenses';

interface RecurringExpenseDialogProps {
  recurringExpense?: RecurringExpense;
  trigger: React.ReactNode;
}

// Dialog reutilizável para criar (sem `recurringExpense`) ou editar (com
// `recurringExpense`) uma despesa recorrente.
export function RecurringExpenseDialog({ recurringExpense, trigger }: RecurringExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!recurringExpense;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar recorrência' : 'Nova despesa recorrente'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados da despesa recorrente.'
              : 'Cadastre uma despesa que se repete automaticamente.'}
          </DialogDescription>
        </DialogHeader>
        <RecurringExpenseForm recurringExpense={recurringExpense} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
