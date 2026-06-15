import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CoupleMemberGuard } from '../couples/guards/couple-member.guard';
import { CurrentCouple } from '../couples/decorators/current-couple.decorator';
import { ReportsService } from './reports.service';
import { MonthlySummaryQueryDto } from './dto/monthly-summary-query.dto';
import { MonthlySummaryResponseDto } from './dto/monthly-summary-response.dto';
import { CashFlowQueryDto } from './dto/cash-flow-query.dto';
import { CashFlowEntryDto } from './dto/cash-flow-entry.dto';

@Controller('reports')
@UseGuards(CoupleMemberGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly-summary')
  async getMonthlySummary(
    @CurrentCouple() coupleId: string,
    @Query() query: MonthlySummaryQueryDto,
  ): Promise<MonthlySummaryResponseDto> {
    return this.reportsService.getMonthlySummary(
      coupleId,
      query.referenceMonth,
    );
  }

  @Get('cash-flow')
  async getCashFlow(
    @CurrentCouple() coupleId: string,
    @Query() query: CashFlowQueryDto,
  ): Promise<CashFlowEntryDto[]> {
    return this.reportsService.getCashFlow(coupleId, query.months);
  }
}
