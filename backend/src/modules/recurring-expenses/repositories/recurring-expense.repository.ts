import { Injectable } from '@nestjs/common';
import { RecurringExpense } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CreateRecurringExpenseData,
  IRecurringExpenseRepository,
  RecurringExpenseEntity,
  UpdateRecurringExpenseData,
} from '../interfaces/recurring-expense-repository.interface';

@Injectable()
export class RecurringExpenseRepository
  implements IRecurringExpenseRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateRecurringExpenseData,
  ): Promise<RecurringExpenseEntity> {
    const recurringExpense = await this.prisma.recurringExpense.create({
      data,
    });
    return this.toEntity(recurringExpense);
  }

  async findById(id: string): Promise<RecurringExpenseEntity | null> {
    const recurringExpense = await this.prisma.recurringExpense.findUnique({
      where: { id },
    });
    return recurringExpense ? this.toEntity(recurringExpense) : null;
  }

  async findByCoupleId(coupleId: string): Promise<RecurringExpenseEntity[]> {
    const recurringExpenses = await this.prisma.recurringExpense.findMany({
      where: { coupleId },
      orderBy: { createdAt: 'asc' },
    });
    return recurringExpenses.map((item) => this.toEntity(item));
  }

  async findAllActive(): Promise<RecurringExpenseEntity[]> {
    const recurringExpenses = await this.prisma.recurringExpense.findMany({
      where: { active: true },
    });
    return recurringExpenses.map((item) => this.toEntity(item));
  }

  async update(
    id: string,
    data: UpdateRecurringExpenseData,
  ): Promise<RecurringExpenseEntity> {
    const recurringExpense = await this.prisma.recurringExpense.update({
      where: { id },
      data,
    });
    return this.toEntity(recurringExpense);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.recurringExpense.delete({ where: { id } });
  }

  // Prisma representa campos Decimal como objetos Decimal; convertemos para
  // number para manter a entidade de domínio livre de tipos do Prisma.
  private toEntity(
    recurringExpense: RecurringExpense,
  ): RecurringExpenseEntity {
    return {
      id: recurringExpense.id,
      coupleId: recurringExpense.coupleId,
      templateDescription: recurringExpense.templateDescription,
      amount: Number(recurringExpense.amount),
      categoryId: recurringExpense.categoryId,
      ownership: recurringExpense.ownership,
      ownerUserId: recurringExpense.ownerUserId,
      sharedSplitPercentageA:
        recurringExpense.sharedSplitPercentageA !== null
          ? Number(recurringExpense.sharedSplitPercentageA)
          : null,
      sharedSplitPercentageB:
        recurringExpense.sharedSplitPercentageB !== null
          ? Number(recurringExpense.sharedSplitPercentageB)
          : null,
      frequency: recurringExpense.frequency,
      dayOfMonth: recurringExpense.dayOfMonth,
      startDate: recurringExpense.startDate,
      endDate: recurringExpense.endDate,
      active: recurringExpense.active,
      createdAt: recurringExpense.createdAt,
      updatedAt: recurringExpense.updatedAt,
    };
  }
}
