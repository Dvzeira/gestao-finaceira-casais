// Tipos espelhando os DTOs do módulo `recurring-expenses` do backend.

import type { ExpenseOwnership } from '@/types/expenses';

export type RecurringFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringExpense {
  id: string;
  templateDescription: string;
  amount: number;
  categoryId: string;
  ownership: ExpenseOwnership;
  ownerUserId: string | null;
  sharedSplitPercentageA: number | null;
  sharedSplitPercentageB: number | null;
  frequency: RecurringFrequency;
  dayOfMonth: number | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OwnershipFields {
  ownership: ExpenseOwnership;
  ownerUserId?: string;
  sharedSplitPercentageA?: number;
  sharedSplitPercentageB?: number;
}

export interface CreateRecurringExpensePayload extends OwnershipFields {
  templateDescription: string;
  amount: number;
  categoryId: string;
  frequency: RecurringFrequency;
  dayOfMonth?: number;
  startDate: string;
  endDate?: string;
}

export interface UpdateRecurringExpensePayload extends Partial<OwnershipFields> {
  templateDescription?: string;
  amount?: number;
  categoryId?: string;
  frequency?: RecurringFrequency;
  dayOfMonth?: number;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}
