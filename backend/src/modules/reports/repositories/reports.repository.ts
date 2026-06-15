import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CategoryExpenseTotal,
  IReportsRepository,
} from '../interfaces/reports-repository.interface';

@Injectable()
export class ReportsRepository implements IReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async sumIncomeByMonth(coupleId: string, month: Date): Promise<number> {
    const result = await this.prisma.income.aggregate({
      where: { coupleId, referenceMonth: month },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }

  async sumExpensesByMonth(coupleId: string, month: Date): Promise<number> {
    const { start, end } = this.monthRange(month);

    const result = await this.prisma.expense.aggregate({
      where: { coupleId, dueDate: { gte: start, lt: end } },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }

  async getExpensesByCategory(
    coupleId: string,
    month: Date,
  ): Promise<CategoryExpenseTotal[]> {
    const { start, end } = this.monthRange(month);

    const grouped = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      where: { coupleId, dueDate: { gte: start, lt: end } },
      _sum: { amount: true },
    });

    if (grouped.length === 0) {
      return [];
    }

    const categories = await this.prisma.expenseCategory.findMany({
      where: { id: { in: grouped.map((group) => group.categoryId) } },
    });
    const categoryNameById = new Map(
      categories.map((category) => [category.id, category.name]),
    );

    return grouped.map((group) => ({
      categoryId: group.categoryId,
      categoryName: categoryNameById.get(group.categoryId) ?? 'Outros',
      total: Number(group._sum.amount ?? 0),
    }));
  }

  // Intervalo [primeiro dia do mês, primeiro dia do mês seguinte) usado para
  // filtrar despesas pela dueDate.
  private monthRange(month: Date): { start: Date; end: Date } {
    const start = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1),
    );
    const end = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1),
    );
    return { start, end };
  }
}
