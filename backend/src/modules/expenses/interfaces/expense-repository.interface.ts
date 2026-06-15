import { ExpenseOwnership, ExpenseStatus } from '@prisma/client';

// Contrato de persistência do domínio Expense. Implementado por
// ExpenseRepository (Prisma) e injetado via token EXPENSE_REPOSITORY,
// permitindo mocks em testes.

export interface ExpenseEntity {
  id: string;
  coupleId: string;
  createdByUserId: string;
  categoryId: string;
  description: string;
  amount: number;
  ownership: ExpenseOwnership;
  ownerUserId: string | null;
  sharedSplitPercentageA: number | null;
  sharedSplitPercentageB: number | null;
  dueDate: Date;
  paidAt: Date | null;
  status: ExpenseStatus;
  isRecurring: boolean;
  recurringExpenseId: string | null;
  isInstallment: boolean;
  installmentParentId: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseData {
  coupleId: string;
  createdByUserId: string;
  categoryId: string;
  description: string;
  amount: number;
  ownership: ExpenseOwnership;
  ownerUserId?: string | null;
  sharedSplitPercentageA?: number | null;
  sharedSplitPercentageB?: number | null;
  dueDate: Date;
  isInstallment?: boolean;
  installmentParentId?: string | null;
  installmentNumber?: number | null;
  installmentTotal?: number | null;
}

export interface UpdateExpenseData {
  categoryId?: string;
  description?: string;
  amount?: number;
  ownership?: ExpenseOwnership;
  ownerUserId?: string | null;
  sharedSplitPercentageA?: number | null;
  sharedSplitPercentageB?: number | null;
  dueDate?: Date;
  status?: ExpenseStatus;
  paidAt?: Date | null;
}

export interface ExpenseFilters {
  referenceMonth?: Date;
  status?: ExpenseStatus;
}

export const EXPENSE_REPOSITORY = Symbol('EXPENSE_REPOSITORY');

export interface IExpenseRepository {
  create(data: CreateExpenseData): Promise<ExpenseEntity>;
  // Cria a despesa "mãe" (1ª parcela) e as demais parcelas vinculadas a ela
  // via installmentParentId, em uma única transação.
  createInstallmentGroup(
    parent: CreateExpenseData,
    children: CreateExpenseData[],
  ): Promise<ExpenseEntity[]>;
  findById(id: string): Promise<ExpenseEntity | null>;
  findByCoupleId(
    coupleId: string,
    filters?: ExpenseFilters,
  ): Promise<ExpenseEntity[]>;
  update(id: string, data: UpdateExpenseData): Promise<ExpenseEntity>;
  delete(id: string): Promise<void>;
}
