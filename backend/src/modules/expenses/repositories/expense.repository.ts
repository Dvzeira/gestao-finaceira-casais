import { Injectable } from '@nestjs/common';
import { Expense, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CreateExpenseData,
  ExpenseEntity,
  ExpenseFilters,
  IExpenseRepository,
  UpdateExpenseData,
} from '../interfaces/expense-repository.interface';

@Injectable()
export class ExpenseRepository implements IExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateExpenseData): Promise<ExpenseEntity> {
    const expense = await this.prisma.expense.create({ data });
    return this.toEntity(expense);
  }

  async createInstallmentGroup(
    parent: CreateExpenseData,
    children: CreateExpenseData[],
  ): Promise<ExpenseEntity[]> {
    return this.prisma.$transaction(async (tx) => {
      const createdParent = await tx.expense.create({ data: parent });

      const createdChildren: Expense[] = [];
      for (const child of children) {
        const created = await tx.expense.create({
          data: { ...child, installmentParentId: createdParent.id },
        });
        createdChildren.push(created);
      }

      return [createdParent, ...createdChildren].map((expense) =>
        this.toEntity(expense),
      );
    });
  }

  async findById(id: string): Promise<ExpenseEntity | null> {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    return expense ? this.toEntity(expense) : null;
  }

  async findByCoupleId(
    coupleId: string,
    filters?: ExpenseFilters,
  ): Promise<ExpenseEntity[]> {
    const where: Prisma.ExpenseWhereInput = { coupleId };

    if (filters?.referenceMonth) {
      const start = filters.referenceMonth;
      const end = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
      );
      where.dueDate = { gte: start, lt: end };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
    return expenses.map((expense) => this.toEntity(expense));
  }

  async update(id: string, data: UpdateExpenseData): Promise<ExpenseEntity> {
    const expense = await this.prisma.expense.update({ where: { id }, data });
    return this.toEntity(expense);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.expense.delete({ where: { id } });
  }

  // Prisma representa campos Decimal como objetos Decimal; convertemos para
  // number para manter a entidade de domínio livre de tipos do Prisma.
  private toEntity(expense: Expense): ExpenseEntity {
    return {
      id: expense.id,
      coupleId: expense.coupleId,
      createdByUserId: expense.createdByUserId,
      categoryId: expense.categoryId,
      description: expense.description,
      amount: Number(expense.amount),
      ownership: expense.ownership,
      ownerUserId: expense.ownerUserId,
      sharedSplitPercentageA:
        expense.sharedSplitPercentageA !== null
          ? Number(expense.sharedSplitPercentageA)
          : null,
      sharedSplitPercentageB:
        expense.sharedSplitPercentageB !== null
          ? Number(expense.sharedSplitPercentageB)
          : null,
      dueDate: expense.dueDate,
      paidAt: expense.paidAt,
      status: expense.status,
      isRecurring: expense.isRecurring,
      recurringExpenseId: expense.recurringExpenseId,
      isInstallment: expense.isInstallment,
      installmentParentId: expense.installmentParentId,
      installmentNumber: expense.installmentNumber,
      installmentTotal: expense.installmentTotal,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }
}
