import { ExpenseOwnership, RecurringFrequency } from '@prisma/client';

export class RecurringExpenseResponseDto {
  id!: string;
  templateDescription!: string;
  amount!: number;
  categoryId!: string;
  ownership!: ExpenseOwnership;
  ownerUserId!: string | null;
  sharedSplitPercentageA!: number | null;
  sharedSplitPercentageB!: number | null;
  frequency!: RecurringFrequency;
  dayOfMonth!: number | null;
  startDate!: Date;
  endDate!: Date | null;
  active!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
