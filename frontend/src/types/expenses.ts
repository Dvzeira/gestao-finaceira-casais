// Tipos espelhando os DTOs do módulo `expenses` do backend.

export type ExpenseOwnership = 'SHARED' | 'INDIVIDUAL';
export type ExpenseStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export interface Expense {
  id: string;
  createdByUserId: string;
  categoryId: string;
  description: string;
  amount: number;
  ownership: ExpenseOwnership;
  ownerUserId: string | null;
  sharedSplitPercentageA: number | null;
  sharedSplitPercentageB: number | null;
  dueDate: string;
  paidAt: string | null;
  status: ExpenseStatus;
  isRecurring: boolean;
  recurringExpenseId: string | null;
  isInstallment: boolean;
  installmentParentId: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  createdAt: string;
  updatedAt: string;
}

interface OwnershipFields {
  ownership: ExpenseOwnership;
  ownerUserId?: string;
  sharedSplitPercentageA?: number;
  sharedSplitPercentageB?: number;
}

export interface CreateExpensePayload extends OwnershipFields {
  description: string;
  amount: number;
  categoryId: string;
  dueDate: string;
  installmentTotal?: number;
}

export interface UpdateExpensePayload extends Partial<OwnershipFields> {
  description?: string;
  amount?: number;
  categoryId?: string;
  dueDate?: string;
  status?: ExpenseStatus;
  paidAt?: string;
}
