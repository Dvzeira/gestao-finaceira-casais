import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExpenseOwnership } from '@prisma/client';
import {
  RECURRING_EXPENSE_REPOSITORY,
  RecurringExpenseEntity,
} from './interfaces/recurring-expense-repository.interface';
import type { IRecurringExpenseRepository } from './interfaces/recurring-expense-repository.interface';
import { EXPENSE_CATEGORY_REPOSITORY } from '../expense-categories/interfaces/expense-category-repository.interface';
import type { IExpenseCategoryRepository } from '../expense-categories/interfaces/expense-category-repository.interface';
import { COUPLE_MEMBER_REPOSITORY } from '../couples/interfaces/couple-member-repository.interface';
import type { ICoupleMemberRepository } from '../couples/interfaces/couple-member-repository.interface';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import { RecurringExpenseResponseDto } from './dto/recurring-expense-response.dto';

@Injectable()
export class RecurringExpensesService {
  constructor(
    @Inject(RECURRING_EXPENSE_REPOSITORY)
    private readonly recurringExpenseRepository: IRecurringExpenseRepository,
    @Inject(EXPENSE_CATEGORY_REPOSITORY)
    private readonly expenseCategoryRepository: IExpenseCategoryRepository,
    @Inject(COUPLE_MEMBER_REPOSITORY)
    private readonly coupleMemberRepository: ICoupleMemberRepository,
  ) {}

  async create(
    coupleId: string,
    dto: CreateRecurringExpenseDto,
  ): Promise<RecurringExpenseResponseDto> {
    await this.validateCategory(coupleId, dto.categoryId);
    await this.validateOwnership(
      coupleId,
      dto.ownership,
      dto.ownerUserId,
      dto.sharedSplitPercentageA,
      dto.sharedSplitPercentageB,
    );
    this.validateFrequency(dto.frequency, dto.dayOfMonth);

    const created = await this.recurringExpenseRepository.create({
      coupleId,
      templateDescription: dto.templateDescription,
      amount: dto.amount,
      categoryId: dto.categoryId,
      ownership: dto.ownership,
      ownerUserId: dto.ownerUserId ?? null,
      sharedSplitPercentageA: dto.sharedSplitPercentageA ?? null,
      sharedSplitPercentageB: dto.sharedSplitPercentageB ?? null,
      frequency: dto.frequency,
      dayOfMonth: dto.dayOfMonth ?? null,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
    });

    return this.toResponseDto(created);
  }

  async findAll(coupleId: string): Promise<RecurringExpenseResponseDto[]> {
    const recurringExpenses =
      await this.recurringExpenseRepository.findByCoupleId(coupleId);
    return recurringExpenses.map((item) => this.toResponseDto(item));
  }

  async findOne(
    coupleId: string,
    id: string,
  ): Promise<RecurringExpenseResponseDto> {
    const recurringExpense = await this.loadOwnedRecurringExpense(
      coupleId,
      id,
    );
    return this.toResponseDto(recurringExpense);
  }

  async update(
    coupleId: string,
    id: string,
    dto: UpdateRecurringExpenseDto,
  ): Promise<RecurringExpenseResponseDto> {
    const recurringExpense = await this.loadOwnedRecurringExpense(
      coupleId,
      id,
    );

    if (dto.categoryId !== undefined) {
      await this.validateCategory(coupleId, dto.categoryId);
    }

    const ownershipChanged =
      dto.ownership !== undefined ||
      dto.ownerUserId !== undefined ||
      dto.sharedSplitPercentageA !== undefined ||
      dto.sharedSplitPercentageB !== undefined;

    if (ownershipChanged) {
      await this.validateOwnership(
        coupleId,
        dto.ownership ?? recurringExpense.ownership,
        dto.ownerUserId !== undefined
          ? dto.ownerUserId
          : (recurringExpense.ownerUserId ?? undefined),
        dto.sharedSplitPercentageA !== undefined
          ? dto.sharedSplitPercentageA
          : (recurringExpense.sharedSplitPercentageA ?? undefined),
        dto.sharedSplitPercentageB !== undefined
          ? dto.sharedSplitPercentageB
          : (recurringExpense.sharedSplitPercentageB ?? undefined),
      );
    }

    if (dto.frequency !== undefined || dto.dayOfMonth !== undefined) {
      this.validateFrequency(
        dto.frequency ?? recurringExpense.frequency,
        dto.dayOfMonth !== undefined
          ? dto.dayOfMonth
          : (recurringExpense.dayOfMonth ?? undefined),
      );
    }

    const updated = await this.recurringExpenseRepository.update(id, {
      ...(dto.templateDescription !== undefined
        ? { templateDescription: dto.templateDescription }
        : {}),
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
      ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
      ...(dto.ownership !== undefined ? { ownership: dto.ownership } : {}),
      ...(dto.ownerUserId !== undefined
        ? { ownerUserId: dto.ownerUserId }
        : {}),
      ...(dto.sharedSplitPercentageA !== undefined
        ? { sharedSplitPercentageA: dto.sharedSplitPercentageA }
        : {}),
      ...(dto.sharedSplitPercentageB !== undefined
        ? { sharedSplitPercentageB: dto.sharedSplitPercentageB }
        : {}),
      ...(dto.frequency !== undefined ? { frequency: dto.frequency } : {}),
      ...(dto.dayOfMonth !== undefined ? { dayOfMonth: dto.dayOfMonth } : {}),
      ...(dto.startDate !== undefined
        ? { startDate: new Date(dto.startDate) }
        : {}),
      ...(dto.endDate !== undefined
        ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
        : {}),
      ...(dto.active !== undefined ? { active: dto.active } : {}),
    });

    return this.toResponseDto(updated);
  }

  async remove(coupleId: string, id: string): Promise<void> {
    await this.loadOwnedRecurringExpense(coupleId, id);
    await this.recurringExpenseRepository.delete(id);
  }

  // Garante que a categoria existe e é acessível pelo casal (global ou
  // criada pelo próprio casal).
  private async validateCategory(
    coupleId: string,
    categoryId: string,
  ): Promise<void> {
    const category =
      await this.expenseCategoryRepository.findById(categoryId);
    if (
      !category ||
      (category.coupleId !== null && category.coupleId !== coupleId)
    ) {
      throw new BadRequestException('Categoria inválida.');
    }
  }

  // Valida as regras de rateio: templates INDIVIDUAL exigem um responsável
  // que pertença ao casal; templates SHARED exigem percentuais que somem 100.
  private async validateOwnership(
    coupleId: string,
    ownership: ExpenseOwnership,
    ownerUserId: string | null | undefined,
    sharedSplitPercentageA: number | null | undefined,
    sharedSplitPercentageB: number | null | undefined,
  ): Promise<void> {
    if (ownership === ExpenseOwnership.INDIVIDUAL) {
      if (!ownerUserId) {
        throw new BadRequestException(
          'ownerUserId é obrigatório para despesas individuais.',
        );
      }

      const member =
        await this.coupleMemberRepository.findByUserId(ownerUserId);
      if (!member || member.coupleId !== coupleId) {
        throw new BadRequestException(
          'O responsável pela despesa deve pertencer ao casal.',
        );
      }
      return;
    }

    if (
      sharedSplitPercentageA == null ||
      sharedSplitPercentageB == null ||
      Math.round((sharedSplitPercentageA + sharedSplitPercentageB) * 100) /
        100 !==
        100
    ) {
      throw new BadRequestException(
        'A soma de sharedSplitPercentageA e sharedSplitPercentageB deve ser 100.',
      );
    }
  }

  // MONTHLY/YEARLY exigem dayOfMonth (dia em que a despesa é gerada);
  // WEEKLY usa startDate como referência e não aceita dayOfMonth.
  private validateFrequency(
    frequency: CreateRecurringExpenseDto['frequency'],
    dayOfMonth: number | null | undefined,
  ): void {
    const requiresDayOfMonth = frequency !== 'WEEKLY';
    if (requiresDayOfMonth && dayOfMonth == null) {
      throw new BadRequestException(
        'dayOfMonth é obrigatório para frequências MONTHLY e YEARLY.',
      );
    }
  }

  // Garante que o template existe e pertence ao casal do usuário autenticado,
  // evitando que um id de outro casal seja acessado/alterado.
  private async loadOwnedRecurringExpense(
    coupleId: string,
    id: string,
  ): Promise<RecurringExpenseEntity> {
    const recurringExpense = await this.recurringExpenseRepository.findById(
      id,
    );
    if (!recurringExpense || recurringExpense.coupleId !== coupleId) {
      throw new NotFoundException('Despesa recorrente não encontrada.');
    }
    return recurringExpense;
  }

  private toResponseDto(
    recurringExpense: RecurringExpenseEntity,
  ): RecurringExpenseResponseDto {
    return {
      id: recurringExpense.id,
      templateDescription: recurringExpense.templateDescription,
      amount: recurringExpense.amount,
      categoryId: recurringExpense.categoryId,
      ownership: recurringExpense.ownership,
      ownerUserId: recurringExpense.ownerUserId,
      sharedSplitPercentageA: recurringExpense.sharedSplitPercentageA,
      sharedSplitPercentageB: recurringExpense.sharedSplitPercentageB,
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
