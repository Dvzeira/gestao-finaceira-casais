import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExpenseOwnership, ExpenseStatus } from '@prisma/client';
import {
  EXPENSE_REPOSITORY,
  CreateExpenseData,
  ExpenseEntity,
} from './interfaces/expense-repository.interface';
import type { IExpenseRepository } from './interfaces/expense-repository.interface';
import { EXPENSE_CATEGORY_REPOSITORY } from '../expense-categories/interfaces/expense-category-repository.interface';
import type { IExpenseCategoryRepository } from '../expense-categories/interfaces/expense-category-repository.interface';
import { COUPLE_MEMBER_REPOSITORY } from '../couples/interfaces/couple-member-repository.interface';
import type { ICoupleMemberRepository } from '../couples/interfaces/couple-member-repository.interface';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';

// Normaliza um valor de data para o primeiro dia do mês (UTC), usado para
// filtrar despesas por mês de referência (dueDate).
function toFirstDayOfMonth(date: string): Date {
  const parsed = new Date(date);
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1));
}

// Soma meses a uma data preservando o dia, usado para gerar as datas de
// vencimento das parcelas seguintes.
function addMonths(date: Date, months: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + months,
      date.getUTCDate(),
    ),
  );
}

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: IExpenseRepository,
    @Inject(EXPENSE_CATEGORY_REPOSITORY)
    private readonly expenseCategoryRepository: IExpenseCategoryRepository,
    @Inject(COUPLE_MEMBER_REPOSITORY)
    private readonly coupleMemberRepository: ICoupleMemberRepository,
  ) {}

  // Cria a despesa. Quando installmentTotal >= 2, gera a despesa "mãe" (1ª
  // parcela) e as parcelas seguintes (dueDate incrementado em meses).
  async create(
    coupleId: string,
    userId: string,
    dto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto[]> {
    await this.validateCategory(coupleId, dto.categoryId);
    await this.validateOwnership(
      coupleId,
      dto.ownership,
      dto.ownerUserId,
      dto.sharedSplitPercentageA,
      dto.sharedSplitPercentageB,
    );

    const baseData: CreateExpenseData = {
      coupleId,
      createdByUserId: userId,
      categoryId: dto.categoryId,
      description: dto.description,
      amount: dto.amount,
      ownership: dto.ownership,
      ownerUserId: dto.ownerUserId ?? null,
      sharedSplitPercentageA: dto.sharedSplitPercentageA ?? null,
      sharedSplitPercentageB: dto.sharedSplitPercentageB ?? null,
      dueDate: new Date(dto.dueDate),
    };

    if (dto.installmentTotal && dto.installmentTotal >= 2) {
      const total = dto.installmentTotal;
      const parentData: CreateExpenseData = {
        ...baseData,
        isInstallment: true,
        installmentNumber: 1,
        installmentTotal: total,
      };

      const children: CreateExpenseData[] = [];
      for (let i = 1; i < total; i++) {
        children.push({
          ...baseData,
          dueDate: addMonths(baseData.dueDate, i),
          isInstallment: true,
          installmentNumber: i + 1,
          installmentTotal: total,
        });
      }

      const created = await this.expenseRepository.createInstallmentGroup(
        parentData,
        children,
      );
      return created.map((expense) => this.toResponseDto(expense));
    }

    const created = await this.expenseRepository.create(baseData);
    return [this.toResponseDto(created)];
  }

  async findAll(
    coupleId: string,
    referenceMonth?: string,
    status?: ExpenseStatus,
  ): Promise<ExpenseResponseDto[]> {
    const expenses = await this.expenseRepository.findByCoupleId(coupleId, {
      referenceMonth: referenceMonth
        ? toFirstDayOfMonth(referenceMonth)
        : undefined,
      status,
    });
    return expenses.map((expense) => this.toResponseDto(expense));
  }

  async findOne(coupleId: string, id: string): Promise<ExpenseResponseDto> {
    const expense = await this.loadOwnedExpense(coupleId, id);
    return this.toResponseDto(expense);
  }

  async update(
    coupleId: string,
    id: string,
    dto: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.loadOwnedExpense(coupleId, id);

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
        dto.ownership ?? expense.ownership,
        dto.ownerUserId !== undefined
          ? dto.ownerUserId
          : (expense.ownerUserId ?? undefined),
        dto.sharedSplitPercentageA !== undefined
          ? dto.sharedSplitPercentageA
          : (expense.sharedSplitPercentageA ?? undefined),
        dto.sharedSplitPercentageB !== undefined
          ? dto.sharedSplitPercentageB
          : (expense.sharedSplitPercentageB ?? undefined),
      );
    }

    // Marcar como PAID sem informar paidAt define a data de pagamento como
    // agora; voltar para PENDING/OVERDUE limpa a data de pagamento.
    let paidAt: Date | null | undefined;
    if (dto.paidAt !== undefined) {
      paidAt = new Date(dto.paidAt);
    } else if (dto.status === ExpenseStatus.PAID) {
      paidAt = expense.paidAt ?? new Date();
    } else if (dto.status !== undefined) {
      paidAt = null;
    }

    const updated = await this.expenseRepository.update(id, {
      ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
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
      ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate) } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(paidAt !== undefined ? { paidAt } : {}),
    });

    return this.toResponseDto(updated);
  }

  async remove(coupleId: string, id: string): Promise<void> {
    await this.loadOwnedExpense(coupleId, id);
    await this.expenseRepository.delete(id);
  }

  // Garante que a categoria existe e é acessível pelo casal (global ou
  // criada pelo próprio casal).
  private async validateCategory(
    coupleId: string,
    categoryId: string,
  ): Promise<void> {
    const category = await this.expenseCategoryRepository.findById(categoryId);
    if (
      !category ||
      (category.coupleId !== null && category.coupleId !== coupleId)
    ) {
      throw new BadRequestException('Categoria inválida.');
    }
  }

  // Valida as regras de rateio: despesas INDIVIDUAL exigem um responsável
  // que pertença ao casal; despesas SHARED exigem percentuais que somem 100.
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

  // Garante que a despesa existe e pertence ao casal do usuário autenticado,
  // evitando que um id de outro casal seja acessado/alterado.
  private async loadOwnedExpense(
    coupleId: string,
    id: string,
  ): Promise<ExpenseEntity> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense || expense.coupleId !== coupleId) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    return expense;
  }

  private toResponseDto(expense: ExpenseEntity): ExpenseResponseDto {
    return {
      id: expense.id,
      createdByUserId: expense.createdByUserId,
      categoryId: expense.categoryId,
      description: expense.description,
      amount: expense.amount,
      ownership: expense.ownership,
      ownerUserId: expense.ownerUserId,
      sharedSplitPercentageA: expense.sharedSplitPercentageA,
      sharedSplitPercentageB: expense.sharedSplitPercentageB,
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
