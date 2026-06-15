import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  INCOME_REPOSITORY,
  IncomeEntity,
} from './interfaces/income-repository.interface';
import type { IIncomeRepository } from './interfaces/income-repository.interface';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { IncomeResponseDto } from './dto/income-response.dto';

// Normaliza o mês de referência para o primeiro dia do mês, garantindo que
// receitas do mesmo mês sejam agrupadas/filtradas de forma consistente.
function toFirstDayOfMonth(date: string): Date {
  const parsed = new Date(date);
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1));
}

@Injectable()
export class IncomesService {
  constructor(
    @Inject(INCOME_REPOSITORY)
    private readonly incomeRepository: IIncomeRepository,
  ) {}

  async create(
    coupleId: string,
    userId: string,
    dto: CreateIncomeDto,
  ): Promise<IncomeResponseDto> {
    const income = await this.incomeRepository.create({
      coupleId,
      userId,
      type: dto.type,
      description: dto.description,
      amount: dto.amount,
      referenceMonth: toFirstDayOfMonth(dto.referenceMonth),
      receivedAt: new Date(dto.receivedAt),
    });

    return this.toResponseDto(income);
  }

  async findAll(
    coupleId: string,
    referenceMonth?: string,
  ): Promise<IncomeResponseDto[]> {
    const incomes = await this.incomeRepository.findByCoupleId(
      coupleId,
      referenceMonth ? toFirstDayOfMonth(referenceMonth) : undefined,
    );

    return incomes.map((income) => this.toResponseDto(income));
  }

  async findOne(coupleId: string, id: string): Promise<IncomeResponseDto> {
    const income = await this.loadOwnedIncome(coupleId, id);
    return this.toResponseDto(income);
  }

  async update(
    coupleId: string,
    id: string,
    dto: UpdateIncomeDto,
  ): Promise<IncomeResponseDto> {
    await this.loadOwnedIncome(coupleId, id);

    const updated = await this.incomeRepository.update(id, {
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
      ...(dto.referenceMonth !== undefined
        ? { referenceMonth: toFirstDayOfMonth(dto.referenceMonth) }
        : {}),
      ...(dto.receivedAt !== undefined
        ? { receivedAt: new Date(dto.receivedAt) }
        : {}),
    });

    return this.toResponseDto(updated);
  }

  async remove(coupleId: string, id: string): Promise<void> {
    await this.loadOwnedIncome(coupleId, id);
    await this.incomeRepository.delete(id);
  }

  // Garante que a receita existe e pertence ao casal do usuário autenticado,
  // evitando que um id de outro casal seja acessado/alterado.
  private async loadOwnedIncome(
    coupleId: string,
    id: string,
  ): Promise<IncomeEntity> {
    const income = await this.incomeRepository.findById(id);
    if (!income || income.coupleId !== coupleId) {
      throw new NotFoundException('Receita não encontrada.');
    }
    return income;
  }

  private toResponseDto(income: IncomeEntity): IncomeResponseDto {
    return {
      id: income.id,
      userId: income.userId,
      type: income.type,
      description: income.description,
      amount: income.amount,
      referenceMonth: income.referenceMonth,
      receivedAt: income.receivedAt,
      createdAt: income.createdAt,
      updatedAt: income.updatedAt,
    };
  }
}
