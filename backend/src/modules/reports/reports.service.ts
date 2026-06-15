import { Inject, Injectable } from '@nestjs/common';
import type { IReportsRepository } from './interfaces/reports-repository.interface';
import { REPORTS_REPOSITORY } from './interfaces/reports-repository.interface';
import { MonthlySummaryResponseDto } from './dto/monthly-summary-response.dto';
import { CashFlowEntryDto } from './dto/cash-flow-entry.dto';

const DEFAULT_CASH_FLOW_MONTHS = 6;

// Normaliza uma data (ou o mês atual, quando ausente) para o primeiro dia do
// mês em UTC, garantindo agregações consistentes por mês de referência.
function toFirstDayOfMonth(date?: string): Date {
  const parsed = date ? new Date(date) : new Date();
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1));
}

@Injectable()
export class ReportsService {
  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly reportsRepository: IReportsRepository,
  ) {}

  async getMonthlySummary(
    coupleId: string,
    referenceMonth?: string,
  ): Promise<MonthlySummaryResponseDto> {
    const month = toFirstDayOfMonth(referenceMonth);

    const [totalIncome, totalExpense, expensesByCategory] = await Promise.all([
      this.reportsRepository.sumIncomeByMonth(coupleId, month),
      this.reportsRepository.sumExpensesByMonth(coupleId, month),
      this.reportsRepository.getExpensesByCategory(coupleId, month),
    ]);

    return {
      referenceMonth: month,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      expensesByCategory,
    };
  }

  async getCashFlow(
    coupleId: string,
    months?: number,
  ): Promise<CashFlowEntryDto[]> {
    const monthCount = months ?? DEFAULT_CASH_FLOW_MONTHS;
    const currentMonth = toFirstDayOfMonth();

    // Gera a lista de meses do mais antigo para o mais recente, incluindo o
    // mês atual.
    const referenceMonths = Array.from({ length: monthCount }, (_, index) => {
      const offset = monthCount - 1 - index;
      return new Date(
        Date.UTC(
          currentMonth.getUTCFullYear(),
          currentMonth.getUTCMonth() - offset,
          1,
        ),
      );
    });

    return Promise.all(
      referenceMonths.map(async (month) => {
        const [totalIncome, totalExpense] = await Promise.all([
          this.reportsRepository.sumIncomeByMonth(coupleId, month),
          this.reportsRepository.sumExpensesByMonth(coupleId, month),
        ]);

        return {
          referenceMonth: month,
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
        };
      }),
    );
  }
}
