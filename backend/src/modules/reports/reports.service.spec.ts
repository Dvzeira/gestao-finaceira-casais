import type { IReportsRepository } from './interfaces/reports-repository.interface';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let reportsService: ReportsService;
  let reportsRepository: jest.Mocked<IReportsRepository>;

  beforeEach(() => {
    reportsRepository = {
      sumIncomeByMonth: jest.fn(),
      sumExpensesByMonth: jest.fn(),
      getExpensesByCategory: jest.fn(),
    };

    reportsService = new ReportsService(reportsRepository);
  });

  describe('getMonthlySummary', () => {
    it('calcula o saldo a partir das receitas e despesas do mês informado', async () => {
      reportsRepository.sumIncomeByMonth.mockResolvedValue(5000);
      reportsRepository.sumExpensesByMonth.mockResolvedValue(3500);
      reportsRepository.getExpensesByCategory.mockResolvedValue([
        { categoryId: 'cat-1', categoryName: 'Moradia', total: 2000 },
        { categoryId: 'cat-2', categoryName: 'Lazer', total: 1500 },
      ]);

      const result = await reportsService.getMonthlySummary(
        'couple-1',
        '2026-06-15',
      );

      const expectedMonth = new Date(Date.UTC(2026, 5, 1));
      expect(reportsRepository.sumIncomeByMonth).toHaveBeenCalledWith(
        'couple-1',
        expectedMonth,
      );
      expect(reportsRepository.sumExpensesByMonth).toHaveBeenCalledWith(
        'couple-1',
        expectedMonth,
      );
      expect(result).toEqual({
        referenceMonth: expectedMonth,
        totalIncome: 5000,
        totalExpense: 3500,
        balance: 1500,
        expensesByCategory: [
          { categoryId: 'cat-1', categoryName: 'Moradia', total: 2000 },
          { categoryId: 'cat-2', categoryName: 'Lazer', total: 1500 },
        ],
      });
    });

    it('assume o mês atual quando nenhum mês é informado', async () => {
      reportsRepository.sumIncomeByMonth.mockResolvedValue(0);
      reportsRepository.sumExpensesByMonth.mockResolvedValue(0);
      reportsRepository.getExpensesByCategory.mockResolvedValue([]);

      const now = new Date();
      const expectedMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );

      const result = await reportsService.getMonthlySummary('couple-1');

      expect(result.referenceMonth).toEqual(expectedMonth);
    });
  });

  describe('getCashFlow', () => {
    it('retorna um registro por mês, do mais antigo para o mais recente', async () => {
      reportsRepository.sumIncomeByMonth.mockResolvedValue(1000);
      reportsRepository.sumExpensesByMonth.mockResolvedValue(400);

      const result = await reportsService.getCashFlow('couple-1', 3);

      expect(result).toHaveLength(3);
      expect(result.every((entry) => entry.balance === 600)).toBe(true);

      const now = new Date();
      const currentMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );
      expect(result[result.length - 1]?.referenceMonth).toEqual(currentMonth);

      const oldestMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1),
      );
      expect(result[0]?.referenceMonth).toEqual(oldestMonth);
    });

    it('usa a quantidade padrão de meses quando não informado', async () => {
      reportsRepository.sumIncomeByMonth.mockResolvedValue(0);
      reportsRepository.sumExpensesByMonth.mockResolvedValue(0);

      const result = await reportsService.getCashFlow('couple-1');

      expect(result).toHaveLength(6);
    });
  });
});
