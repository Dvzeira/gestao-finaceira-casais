import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import type { Expense } from '@/types/expenses';

interface ExpenseDialogProps {
  expense?: Expense;
  trigger: React.ReactNode;
}

// Dialog reutilizável para criar (sem `expense`) ou editar (com `expense`) uma despesa.
export function ExpenseDialog({ expense, trigger }: ExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!expense;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar despesa' : 'Nova despesa'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados da despesa.'
              : 'Registre uma nova despesa do casal.'}
          </DialogDescription>
        </DialogHeader>
        <ExpenseForm expense={expense} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
