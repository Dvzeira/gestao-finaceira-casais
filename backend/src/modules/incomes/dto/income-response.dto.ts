import { IncomeType } from '@prisma/client';

export class IncomeResponseDto {
  id!: string;
  userId!: string;
  type!: IncomeType;
  description!: string;
  amount!: number;
  referenceMonth!: Date;
  receivedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}
