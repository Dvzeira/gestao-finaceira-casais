import { ExpenseOwnership, ExpenseStatus } from '@prisma/client';

export class ExpenseResponseDto {
  id!: string;
  createdByUserId!: string;
  categoryId!: string;
  description!: string;
  amount!: number;
  ownership!: ExpenseOwnership;
  ownerUserId!: string | null;
  sharedSplitPercentageA!: number | null;
  sharedSplitPercentageB!: number | null;
  dueDate!: Date;
  paidAt!: Date | null;
  status!: ExpenseStatus;
  isRecurring!: boolean;
  recurringExpenseId!: string | null;
  isInstallment!: boolean;
  installmentParentId!: string | null;
  installmentNumber!: number | null;
  installmentTotal!: number | null;
  createdAt!: Date;
  updatedAt!: Date;
}
