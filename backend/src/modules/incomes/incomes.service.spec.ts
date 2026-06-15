import { NotFoundException } from '@nestjs/common';
import { IncomeType } from '@prisma/client';
import type {
  IIncomeRepository,
  IncomeEntity,
} from './interfaces/income-repository.interface';
import { IncomesService } from './incomes.service';

function buildIncome(overrides: Partial<IncomeEntity> = {}): IncomeEntity {
  return {
    id: 'income-1',
    coupleId: 'couple-1',
    userId: 'user-1',
    type: IncomeType.SALARY,
    description: 'Salário',
    amount: 5000,
    referenceMonth: new Date('2026-06-01'),
    receivedAt: new Date('2026-06-05'),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('IncomesService', () => {
  let incomesService: IncomesService;
  let incomeRepository: jest.Mocked<IIncomeRepository>;

  beforeEach(() => {
    incomeRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCoupleId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    incomesService = new IncomesService(incomeRepository);
  });

  describe('create', () => {
    it('cria uma receita normalizando o mês de referência para o primeiro dia do mês', async () => {
      incomeRepository.create.mockResolvedValue(buildIncome());

      const result = await incomesService.create('couple-1', 'user-1', {
        type: IncomeType.SALARY,
        description: 'Salário',
        amount: 5000,
        referenceMonth: '2026-06-15',
        receivedAt: '2026-06-05',
      });

      expect(incomeRepository.create).toHaveBeenCalledWith({
        coupleId: 'couple-1',
        userId: 'user-1',
        type: IncomeType.SALARY,
        description: 'Salário',
        amount: 5000,
        referenceMonth: new Date(Date.UTC(2026, 5, 1)),
        receivedAt: new Date('2026-06-05'),
      });
      expect(result.id).toBe('income-1');
    });
  });

  describe('findAll', () => {
    it('lista as receitas do casal filtrando pelo mês informado', async () => {
      incomeRepository.findByCoupleId.mockResolvedValue([buildIncome()]);

      const result = await incomesService.findAll('couple-1', '2026-06-20');

      expect(incomeRepository.findByCoupleId).toHaveBeenCalledWith(
        'couple-1',
        new Date(Date.UTC(2026, 5, 1)),
      );
      expect(result).toHaveLength(1);
    });

    it('lista todas as receitas do casal quando nenhum mês é informado', async () => {
      incomeRepository.findByCoupleId.mockResolvedValue([buildIncome()]);

      await incomesService.findAll('couple-1');

      expect(incomeRepository.findByCoupleId).toHaveBeenCalledWith(
        'couple-1',
        undefined,
      );
    });
  });

  describe('findOne', () => {
    it('retorna a receita quando pertence ao casal', async () => {
      incomeRepository.findById.mockResolvedValue(buildIncome());

      const result = await incomesService.findOne('couple-1', 'income-1');

      expect(result.id).toBe('income-1');
    });

    it('lança NotFoundException quando a receita não existe', async () => {
      incomeRepository.findById.mockResolvedValue(null);

      await expect(
        incomesService.findOne('couple-1', 'income-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lança NotFoundException quando a receita pertence a outro casal', async () => {
      incomeRepository.findById.mockResolvedValue(
        buildIncome({ coupleId: 'couple-2' }),
      );

      await expect(
        incomesService.findOne('couple-1', 'income-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('atualiza apenas os campos informados', async () => {
      incomeRepository.findById.mockResolvedValue(buildIncome());
      incomeRepository.update.mockResolvedValue(
        buildIncome({ description: 'Salário atualizado', amount: 5500 }),
      );

      const result = await incomesService.update('couple-1', 'income-1', {
        description: 'Salário atualizado',
        amount: 5500,
      });

      expect(incomeRepository.update).toHaveBeenCalledWith('income-1', {
        description: 'Salário atualizado',
        amount: 5500,
      });
      expect(result.description).toBe('Salário atualizado');
    });

    it('lança NotFoundException quando a receita não pertence ao casal', async () => {
      incomeRepository.findById.mockResolvedValue(
        buildIncome({ coupleId: 'couple-2' }),
      );

      await expect(
        incomesService.update('couple-1', 'income-1', { amount: 100 }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(incomeRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('remove a receita quando pertence ao casal', async () => {
      incomeRepository.findById.mockResolvedValue(buildIncome());

      await incomesService.remove('couple-1', 'income-1');

      expect(incomeRepository.delete).toHaveBeenCalledWith('income-1');
    });

    it('lança NotFoundException quando a receita não pertence ao casal', async () => {
      incomeRepository.findById.mockResolvedValue(
        buildIncome({ coupleId: 'couple-2' }),
      );

      await expect(
        incomesService.remove('couple-1', 'income-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(incomeRepository.delete).not.toHaveBeenCalled();
    });
  });
});
