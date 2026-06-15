import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpenseOwnership, ExpenseStatus } from '@prisma/client';
import type {
  IExpenseRepository,
  ExpenseEntity,
} from './interfaces/expense-repository.interface';
import type {
  IExpenseCategoryRepository,
  ExpenseCategoryEntity,
} from '../expense-categories/interfaces/expense-category-repository.interface';
import type {
  ICoupleMemberRepository,
  CoupleMemberEntity,
} from '../couples/interfaces/couple-member-repository.interface';
import { CoupleMemberRole } from '@prisma/client';
import { ExpensesService } from './expenses.service';

function buildExpense(overrides: Partial<ExpenseEntity> = {}): ExpenseEntity {
  return {
    id: 'expense-1',
    coupleId: 'couple-1',
    createdByUserId: 'user-1',
    categoryId: 'category-1',
    description: 'Aluguel',
    amount: 1500,
    ownership: ExpenseOwnership.SHARED,
    ownerUserId: null,
    sharedSplitPercentageA: 50,
    sharedSplitPercentageB: 50,
    dueDate: new Date('2026-06-10'),
    paidAt: null,
    status: ExpenseStatus.PENDING,
    isRecurring: false,
    recurringExpenseId: null,
    isInstallment: false,
    installmentParentId: null,
    installmentNumber: null,
    installmentTotal: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildCategory(
  overrides: Partial<ExpenseCategoryEntity> = {},
): ExpenseCategoryEntity {
  return {
    id: 'category-1',
    coupleId: null,
    name: 'Moradia',
    icon: 'home',
    color: '#2563eb',
    ...overrides,
  };
}

function buildMember(
  overrides: Partial<CoupleMemberEntity> = {},
): CoupleMemberEntity {
  return {
    id: 'member-1',
    coupleId: 'couple-1',
    userId: 'user-2',
    role: CoupleMemberRole.MEMBER,
    joinedAt: new Date(),
    ...overrides,
  };
}

describe('ExpensesService', () => {
  let expensesService: ExpensesService;
  let expenseRepository: jest.Mocked<IExpenseRepository>;
  let expenseCategoryRepository: jest.Mocked<IExpenseCategoryRepository>;
  let coupleMemberRepository: jest.Mocked<ICoupleMemberRepository>;

  beforeEach(() => {
    expenseRepository = {
      create: jest.fn(),
      createInstallmentGroup: jest.fn(),
      findById: jest.fn(),
      findByCoupleId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    expenseCategoryRepository = {
      findAllForCouple: jest.fn(),
      findById: jest.fn(),
      findByCoupleIdAndName: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    coupleMemberRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findByCoupleId: jest.fn(),
      countByCoupleId: jest.fn(),
    };

    expensesService = new ExpensesService(
      expenseRepository,
      expenseCategoryRepository,
      coupleMemberRepository,
    );
  });

  describe('create', () => {
    it('cria uma despesa SHARED com percentuais válidos', async () => {
      expenseCategoryRepository.findById.mockResolvedValue(buildCategory());
      expenseRepository.create.mockResolvedValue(buildExpense());

      const result = await expensesService.create('couple-1', 'user-1', {
        description: 'Aluguel',
        amount: 1500,
        categoryId: 'category-1',
        ownership: ExpenseOwnership.SHARED,
        sharedSplitPercentageA: 50,
        sharedSplitPercentageB: 50,
        dueDate: '2026-06-10',
      });

      expect(expenseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          coupleId: 'couple-1',
          createdByUserId: 'user-1',
          ownership: ExpenseOwnership.SHARED,
          sharedSplitPercentageA: 50,
          sharedSplitPercentageB: 50,
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('lança BadRequestException quando a categoria não existe', async () => {
      expenseCategoryRepository.findById.mockResolvedValue(null);

      await expect(
        expensesService.create('couple-1', 'user-1', {
          description: 'Aluguel',
          amount: 1500,
          categoryId: 'category-1',
          ownership: ExpenseOwnership.SHARED,
          sharedSplitPercentageA: 50,
          sharedSplitPercentageB: 50,
          dueDate: '2026-06-10',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(expenseRepository.create).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando a categoria pertence a outro casal', async () => {
      expenseCategoryRepository.findById.mockResolvedValue(
        buildCategory({ coupleId: 'couple-2' }),
      );

      await expect(
        expensesService.create('couple-1', 'user-1', {
          description: 'Aluguel',
          amount: 1500,
          categoryId: 'category-1',
          ownership: ExpenseOwnership.SHARED,
          sharedSplitPercentageA: 50,
          sharedSplitPercentageB: 50,
          dueDate: '2026-06-10',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lança BadRequestException quando os percentuais SHARED não somam 100', async () => {
      expenseCategoryRepository.findById.mockResolvedValue(buildCategory());

      await expect(
        expensesService.create('couple-1', 'user-1', {
          description: 'Aluguel',
          amount: 1500,
          categoryId: 'category-1',
          ownership: ExpenseOwnership.SHARED,
          sharedSplitPercentageA: 40,
          sharedSplitPercentageB: 50,
          dueDate: '2026-06-10',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(expenseRepository.create).not.toHaveBeenCalled();
    });

    it('cria uma despesa INDIVIDUAL quando ownerUserId pertence ao casal', async () => {
      expenseCategoryRepository.findById.mockResolvedValue(buildCategory());
      coupleMemberRepository.findByUserId.mockResolvedValue(buildMember());
      expenseRepository.create.mockResolvedValue(
        buildExpense({
          ownership: ExpenseOwnership.INDIVIDUAL,
          ownerUserId: 'user-2',
          sharedSplitPercentageA: null,
          sharedSplitPercentageB: null,
        }),
      );

      const result = await expensesService.create('couple-1', 'user-1', {
        description: 'Curso',
        amount: 200,
        categoryId: 'category-1',
        ownership: ExpenseOwnership.INDIVIDUAL,
        ownerUserId: 'user-2',
        dueDate: '2026-06-10',
      });

      expect(result[0]?.ownerUserId).toBe('user-2');
    });

    it('lança BadRequestException quando ownerUserId não pertence ao casal', async () => {
      expenseCategoryRepository.findById.mockResolvedValue(buildCategory());
      coupleMemberRepository.findByUserId.mockResolvedValue(
        buildMember({ coupleId: 'couple-2' }),
      );

      await expect(
        expensesService.create('couple-1', 'user-1', {
          description: 'Curso',
          amount: 200,
          categoryId: 'category-1',
          ownership: ExpenseOwnership.INDIVIDUAL,
          ownerUserId: 'user-2',
          dueDate: '2026-06-10',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(expenseRepository.create).not.toHaveBeenCalled();
    });

    it('gera o grupo de parcelas quando installmentTotal >= 2', async () => {
      expenseCategoryRepository.findById.mockResolvedValue(buildCategory());
      expenseRepository.createInstallmentGroup.mockResolvedValue([
        buildExpense({
          id: 'expense-1',
          isInstallment: true,
          installmentNumber: 1,
          installmentTotal: 3,
        }),
        buildExpense({
          id: 'expense-2',
          isInstallment: true,
          installmentNumber: 2,
          installmentTotal: 3,
          installmentParentId: 'expense-1',
          dueDate: new Date(Date.UTC(2026, 6, 10)),
        }),
        buildExpense({
          id: 'expense-3',
          isInstallment: true,
          installmentNumber: 3,
          installmentTotal: 3,
          installmentParentId: 'expense-1',
          dueDate: new Date(Date.UTC(2026, 7, 10)),
        }),
      ]);

      const result = await expensesService.create('couple-1', 'user-1', {
        description: 'Geladeira',
        amount: 300,
        categoryId: 'category-1',
        ownership: ExpenseOwnership.SHARED,
        sharedSplitPercentageA: 50,
        sharedSplitPercentageB: 50,
        dueDate: '2026-06-10',
        installmentTotal: 3,
      });

      expect(expenseRepository.createInstallmentGroup).toHaveBeenCalledTimes(1);
      const [parent, children] =
        expenseRepository.createInstallmentGroup.mock.calls[0] ?? [];
      expect(parent).toEqual(
        expect.objectContaining({ installmentNumber: 1, installmentTotal: 3 }),
      );
      expect(children).toHaveLength(2);
      expect(children?.[0]).toEqual(
        expect.objectContaining({
          installmentNumber: 2,
          dueDate: new Date(Date.UTC(2026, 6, 10)),
        }),
      );
      expect(result).toHaveLength(3);
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException quando a despesa pertence a outro casal', async () => {
      expenseRepository.findById.mockResolvedValue(
        buildExpense({ coupleId: 'couple-2' }),
      );

      await expect(
        expensesService.findOne('couple-1', 'expense-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('marca a despesa como PAID definindo paidAt automaticamente', async () => {
      expenseRepository.findById.mockResolvedValue(buildExpense());
      expenseRepository.update.mockResolvedValue(
        buildExpense({ status: ExpenseStatus.PAID, paidAt: new Date() }),
      );

      const result = await expensesService.update('couple-1', 'expense-1', {
        status: ExpenseStatus.PAID,
      });

      expect(expenseRepository.update).toHaveBeenCalledWith(
        'expense-1',
        expect.objectContaining({
          status: ExpenseStatus.PAID,
          paidAt: expect.any(Date) as Date,
        }),
      );
      expect(result.status).toBe(ExpenseStatus.PAID);
    });

    it('limpa paidAt ao voltar o status para PENDING', async () => {
      expenseRepository.findById.mockResolvedValue(
        buildExpense({ status: ExpenseStatus.PAID, paidAt: new Date() }),
      );
      expenseRepository.update.mockResolvedValue(buildExpense());

      await expensesService.update('couple-1', 'expense-1', {
        status: ExpenseStatus.PENDING,
      });

      expect(expenseRepository.update).toHaveBeenCalledWith(
        'expense-1',
        expect.objectContaining({
          status: ExpenseStatus.PENDING,
          paidAt: null,
        }),
      );
    });

    it('revalida o rateio quando os percentuais SHARED são alterados', async () => {
      expenseRepository.findById.mockResolvedValue(buildExpense());

      await expect(
        expensesService.update('couple-1', 'expense-1', {
          sharedSplitPercentageA: 70,
          sharedSplitPercentageB: 20,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(expenseRepository.update).not.toHaveBeenCalled();
    });

    it('lança NotFoundException quando a despesa não pertence ao casal', async () => {
      expenseRepository.findById.mockResolvedValue(
        buildExpense({ coupleId: 'couple-2' }),
      );

      await expect(
        expensesService.update('couple-1', 'expense-1', { amount: 100 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('remove a despesa quando pertence ao casal', async () => {
      expenseRepository.findById.mockResolvedValue(buildExpense());

      await expensesService.remove('couple-1', 'expense-1');

      expect(expenseRepository.delete).toHaveBeenCalledWith('expense-1');
    });

    it('lança NotFoundException quando a despesa não pertence ao casal', async () => {
      expenseRepository.findById.mockResolvedValue(
        buildExpense({ coupleId: 'couple-2' }),
      );

      await expect(
        expensesService.remove('couple-1', 'expense-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(expenseRepository.delete).not.toHaveBeenCalled();
    });
  });
});
