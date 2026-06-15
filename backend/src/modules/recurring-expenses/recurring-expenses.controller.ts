import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CoupleMemberGuard } from '../couples/guards/couple-member.guard';
import { CurrentCouple } from '../couples/decorators/current-couple.decorator';
import { RecurringExpensesService } from './recurring-expenses.service';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import { RecurringExpenseResponseDto } from './dto/recurring-expense-response.dto';

@Controller('recurring-expenses')
@UseGuards(CoupleMemberGuard)
export class RecurringExpensesController {
  constructor(
    private readonly recurringExpensesService: RecurringExpensesService,
  ) {}

  @Post()
  async create(
    @CurrentCouple() coupleId: string,
    @Body() dto: CreateRecurringExpenseDto,
  ): Promise<RecurringExpenseResponseDto> {
    return this.recurringExpensesService.create(coupleId, dto);
  }

  @Get()
  async findAll(
    @CurrentCouple() coupleId: string,
  ): Promise<RecurringExpenseResponseDto[]> {
    return this.recurringExpensesService.findAll(coupleId);
  }

  @Get(':id')
  async findOne(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
  ): Promise<RecurringExpenseResponseDto> {
    return this.recurringExpensesService.findOne(coupleId, id);
  }

  @Patch(':id')
  async update(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringExpenseDto,
  ): Promise<RecurringExpenseResponseDto> {
    return this.recurringExpensesService.update(coupleId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.recurringExpensesService.remove(coupleId, id);
  }
}
