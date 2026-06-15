import { Injectable } from '@nestjs/common';
import { Income } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CreateIncomeData,
  IIncomeRepository,
  IncomeEntity,
  UpdateIncomeData,
} from '../interfaces/income-repository.interface';

@Injectable()
export class IncomeRepository implements IIncomeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateIncomeData): Promise<IncomeEntity> {
    const income = await this.prisma.income.create({ data });
    return this.toEntity(income);
  }

  async findById(id: string): Promise<IncomeEntity | null> {
    const income = await this.prisma.income.findUnique({ where: { id } });
    return income ? this.toEntity(income) : null;
  }

  async findByCoupleId(
    coupleId: string,
    referenceMonth?: Date,
  ): Promise<IncomeEntity[]> {
    const incomes = await this.prisma.income.findMany({
      where: {
        coupleId,
        ...(referenceMonth ? { referenceMonth } : {}),
      },
      orderBy: { receivedAt: 'desc' },
    });
    return incomes.map((income) => this.toEntity(income));
  }

  async update(id: string, data: UpdateIncomeData): Promise<IncomeEntity> {
    const income = await this.prisma.income.update({ where: { id }, data });
    return this.toEntity(income);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.income.delete({ where: { id } });
  }

  // Prisma representa o campo Decimal como um objeto Decimal; convertemos
  // para number para manter a entidade de domínio livre de tipos do Prisma.
  private toEntity(income: Income): IncomeEntity {
    return {
      id: income.id,
      coupleId: income.coupleId,
      userId: income.userId,
      type: income.type,
      description: income.description,
      amount: Number(income.amount),
      referenceMonth: income.referenceMonth,
      receivedAt: income.receivedAt,
      createdAt: income.createdAt,
      updatedAt: income.updatedAt,
    };
  }
}
