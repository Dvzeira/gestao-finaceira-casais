import { ExpenseOwnership, RecurringFrequency } from '@prisma/client';

// Contrato de persistência do domínio RecurringExpense. Implementado por
// RecurringExpenseRepository (Prisma) e injetado via token
// RECURRING_EXPENSE_REPOSITORY, permitindo mocks em testes.

export interface RecurringExpenseEntity {
  id: string;
  coupleId: string;
  templateDescription: string;
  amount: number;
  categoryId: string;
  ownership: ExpenseOwnership;
  ownerUserId: string | null;
  sharedSplitPercentageA: number | null;
  sharedSplitPercentageB: number | null;
  frequency: RecurringFrequency;
  dayOfMonth: number | null;
  startDate: Date;
  endDate: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRecurringExpenseData {
  coupleId: string;
  templateDescription: string;
  amount: number;
  categoryId: string;
  ownership: ExpenseOwnership;
  ownerUserId?: string | null;
  sharedSplitPercentageA?: number | null;
  sharedSplitPercentageB?: number | null;
  frequency: RecurringFrequency;
  dayOfMonth?: number | null;
  startDate: Date;
  endDate?: Date | null;
}

export interface UpdateRecurringExpenseData {
  templateDescription?: string;
  amount?: number;
  categoryId?: string;
  ownership?: ExpenseOwnership;
  ownerUserId?: string | null;
  sharedSplitPercentageA?: number | null;
  sharedSplitPercentageB?: number | null;
  frequency?: RecurringFrequency;
  dayOfMonth?: number | null;
  startDate?: Date;
  endDate?: Date | null;
  active?: boolean;
}

export const RECURRING_EXPENSE_REPOSITORY = Symbol(
  'RECURRING_EXPENSE_REPOSITORY',
);

export interface IRecurringExpenseRepository {
  create(data: CreateRecurringExpenseData): Promise<RecurringExpenseEntity>;
  findById(id: string): Promise<RecurringExpenseEntity | null>;
  findByCoupleId(coupleId: string): Promise<RecurringExpenseEntity[]>;
  // Usado pelo job de geração: todos os templates ativos de todos os casais.
  findAllActive(): Promise<RecurringExpenseEntity[]>;
  update(
    id: string,
    data: UpdateRecurringExpenseData,
  ): Promise<RecurringExpenseEntity>;
  delete(id: string): Promise<void>;
}
