import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ExpenseOwnership,
  RecurringFrequency,
  CoupleMemberRole,
} from '@prisma/client';
import type {
  IRecurringExpenseRepository,
  RecurringExpenseEntity,
} from './interfaces/recurring-expense-repository.interface';
import type {
  IExpenseCategoryRepository,
  ExpenseCategoryEntity,
} from '../expense-categories/interfaces/expense-category-repository.interface';
import type {
  ICoupleMemberRepository,
  CoupleMemberEntity,
} from '../couples/interfaces/couple-member-repository.interface';
import { RecurringExpensesService } from './recurring-expenses.service';

function buildRecurringExpense(
  overrides: Partial<RecurringExpenseEntity> = {},
): RecurringExpenseEntity {
  return {
    id: 'recurring-1',
    coupleId: 'couple-1',
    templateDescription: 'Aluguel',
    amount: 1500,
    categoryId: 'category-1',
    ownership: ExpenseOwnership.SHARED,
    ownerUserId: null,
    sharedSplitPercentageA: 50,
    sharedSplitPercentageB: 50,
    frequency: RecurringFrequency.MONTHLY,
    dayOfMonth: 10,
    startDate: new Date('2026-06-10'),
    endDate: null,
    active: true,
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

describe('RecurringExpensesService', () => {
  let service: RecurringExpensesService;
  let recurringExpenseRepository: jest.Mocked<IRecurringExpenseRepository>;
  let expenseCategoryRepository: jest.Mocked<IExpenseCategoryRepository>;
  let coupleMemberRepository: jest.Mocked<ICoupleMemberRepository>;

  beforeEach(() => {
    recurringExpenseRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCoupleId: jest.fn(),
      findAllActive: jest.fn(),
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

    service = new RecurringExpensesService(
      recurringExpenseRepository,
      expenseCategoryRepository,
      coupleMemberRepository,
    );
  });

  describe('create', () => {
    it('cria um template SHARED com percentuais válidos', async () => {
      expenseCategoryRepository.findById.mockResolvedValue(buildCategory());
      recurringExpenseRepository.create.mockResolvedValue(
        buildRecurringExpense(),
      );

      const result = await service.create('couple-1', {
        templateDescription: 'Aluguel',
        amount: 1500,
        categoryId: 'category-1',
        ownership: ExpenseOwnership.SHARED,
        sharedSplitPercentageA: 50,
        sharedSplitPercentageB: 50,
        frequency: RecurringFrequency.MONTHLY,
        dayOfMonth: 10,
        startDate: '2026-06-10',
      });

      expect(recurringExpenseRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          coupleId: 'couple-1',
          ownership: ExpenseOwnership.SHARED,
          sharedSplitPercentageA: 50,
          sharedSplitPercentageB: 50,
        }),
      );
      expect(result.id).toBe('recurring-1');
    });

    it('lança BadRequestException quando a categoria não existe', async () => {
      expenseCategoryRepository.findById.mockResolvedValue(null);

      await expect(
        service.create('couple-1', {
          templateDescription: 'Aluguel',
          amount: 1500,
          categoryId: 'category-1',
          ownership: ExpenseOwnership.SHARED,
          sharedSplitPercentageA: 50,
          sharedSplitPercentageB: 50,
          frequency: RecurringFrequency.MONTHLY,
          dayOfMonth: 10,
          startDate: '2026-06-10',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(recurringExpenseRepository.create).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando os percentuais SHARED não somam 100', async () => {
      expenseCategoryRepository.findById.mockResolvedValue(buildCategory());

      await expect(
        service.create('couple-1', {
          templateDescription: 'Aluguel',
          amount: 1500,
          categoryId: 'category-1',
          ownership: ExpenseOwnership.SHARED,
          sharedSplitPercentageA: 40,
          sharedSplitPercentageB: 50,
          frequency: RecurringFrequency.MONTHLY,
          dayOfMonth: 10,
          startDate: '2026-06-10',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(recurringExpenseRepository.create).not.toHaveBeenCalled();
    });

    it('cria um template INDIVIDUAL quando ownerUserId pertence ao casal', async () => {
      expenseCategoryRepository.findById.mockResolvedValue(buildCategory());
      coupleMemberRepository.findByUserId.mockResolvedValue(buildMember());
      recurringExpenseRepository.create.mockResolvedValue(
        buildRecurringExpense({
          ownership: ExpenseOwnership.INDIVIDUAL,
          ownerUserId: 'user-2',
          sharedSplitPercentageA: null,
          sharedSplitPercentageB: null,
        }),
      );

      const result = await service.create('couple-1', {
        templateDescription: 'Plano de saúde',
        amount: 200,
        categoryId: 'category-1',
        ownership: ExpenseOwnership.INDIVIDUAL,
        ownerUserId: 'user-2',
        frequency: RecurringFrequency.MONTHLY,
        dayOfMonth: 5,
        startDate: '2026-06-05',
      });

      expect(result.ownerUserId).toBe('user-2');
    });

    it('lança BadRequestException quando ownerUserId não pertence ao casal', async () => {
      expenseCategoryRepository.findById.mockResolvedValue(buildCategory());
      coupleMemberRepository.findByUserId.mockResolvedValue(
        buildMember({ coupleId: 'couple-2' }),
      );

      await expect(
        service.create('couple-1', {
          templateDescription: 'Plano de saúde',
          amount: 200,
          categoryId: 'category-1',
          ownership: ExpenseOwnership.INDIVIDUAL,
          ownerUserId: 'user-2',
          frequency: RecurringFrequency.MONTHLY,
          dayOfMonth: 5,
          startDate: '2026-06-05',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lança BadRequestException quando MONTHLY/YEARLY não informa dayOfMonth', async () => {
      expenseCategoryRepository.findById.mockResolvedValue(buildCategory());

      await expect(
        service.create('couple-1', {
          templateDescription: 'Aluguel',
          amount: 1500,
          categoryId: 'category-1',
          ownership: ExpenseOwnership.SHARED,
          sharedSplitPercentageA: 50,
          sharedSplitPercentageB: 50,
          frequency: RecurringFrequency.MONTHLY,
          startDate: '2026-06-10',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(recurringExpenseRepository.create).not.toHaveBeenCalled();
    });

    it('aceita WEEKLY sem dayOfMonth', async () => {
      expenseCategoryRepository.findById.mockResolvedValue(buildCategory());
      recurringExpenseRepository.create.mockResolvedValue(
        buildRecurringExpense({
          frequency: RecurringFrequency.WEEKLY,
          dayOfMonth: null,
        }),
      );

      const result = await service.create('couple-1', {
        templateDescription: 'Feira',
        amount: 100,
        categoryId: 'category-1',
        ownership: ExpenseOwnership.SHARED,
        sharedSplitPercentageA: 50,
        sharedSplitPercentageB: 50,
        frequency: RecurringFrequency.WEEKLY,
        startDate: '2026-06-10',
      });

      expect(result.frequency).toBe(RecurringFrequency.WEEKLY);
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException quando o template pertence a outro casal', async () => {
      recurringExpenseRepository.findById.mockResolvedValue(
        buildRecurringExpense({ coupleId: 'couple-2' }),
      );

      await expect(
        service.findOne('couple-1', 'recurring-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('revalida o rateio quando os percentuais SHARED são alterados', async () => {
      recurringExpenseRepository.findById.mockResolvedValue(
        buildRecurringExpense(),
      );

      await expect(
        service.update('couple-1', 'recurring-1', {
          sharedSplitPercentageA: 70,
          sharedSplitPercentageB: 20,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(recurringExpenseRepository.update).not.toHaveBeenCalled();
    });

    it('atualiza campos simples do template', async () => {
      recurringExpenseRepository.findById.mockResolvedValue(
        buildRecurringExpense(),
      );
      recurringExpenseRepository.update.mockResolvedValue(
        buildRecurringExpense({ amount: 1600, active: false }),
      );

      const result = await service.update('couple-1', 'recurring-1', {
        amount: 1600,
        active: false,
      });

      expect(recurringExpenseRepository.update).toHaveBeenCalledWith(
        'recurring-1',
        expect.objectContaining({ amount: 1600, active: false }),
      );
      expect(result.amount).toBe(1600);
      expect(result.active).toBe(false);
    });

    it('lança NotFoundException quando o template não pertence ao casal', async () => {
      recurringExpenseRepository.findById.mockResolvedValue(
        buildRecurringExpense({ coupleId: 'couple-2' }),
      );

      await expect(
        service.update('couple-1', 'recurring-1', { amount: 100 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('remove o template quando pertence ao casal', async () => {
      recurringExpenseRepository.findById.mockResolvedValue(
        buildRecurringExpense(),
      );

      await service.remove('couple-1', 'recurring-1');

      expect(recurringExpenseRepository.delete).toHaveBeenCalledWith(
        'recurring-1',
      );
    });

    it('lança NotFoundException quando o template não pertence ao casal', async () => {
      recurringExpenseRepository.findById.mockResolvedValue(
        buildRecurringExpense({ coupleId: 'couple-2' }),
      );

      await expect(
        service.remove('couple-1', 'recurring-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(recurringExpenseRepository.delete).not.toHaveBeenCalled();
    });
  });
});
