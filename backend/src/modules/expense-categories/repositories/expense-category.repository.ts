import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CreateExpenseCategoryData,
  ExpenseCategoryEntity,
  IExpenseCategoryRepository,
} from '../interfaces/expense-category-repository.interface';

@Injectable()
export class ExpenseCategoryRepository implements IExpenseCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForCouple(coupleId: string): Promise<ExpenseCategoryEntity[]> {
    return this.prisma.expenseCategory.findMany({
      where: { OR: [{ coupleId: null }, { coupleId }] },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<ExpenseCategoryEntity | null> {
    return this.prisma.expenseCategory.findUnique({ where: { id } });
  }

  async findByCoupleIdAndName(
    coupleId: string | null,
    name: string,
  ): Promise<ExpenseCategoryEntity | null> {
    return this.prisma.expenseCategory.findFirst({
      where: { coupleId, name },
    });
  }

  async create(
    data: CreateExpenseCategoryData,
  ): Promise<ExpenseCategoryEntity> {
    return this.prisma.expenseCategory.create({ data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.expenseCategory.delete({ where: { id } });
  }
}
