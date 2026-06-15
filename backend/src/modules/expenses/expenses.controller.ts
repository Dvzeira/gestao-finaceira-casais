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
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CoupleMemberGuard } from '../couples/guards/couple-member.guard';
import { CurrentCouple } from '../couples/decorators/current-couple.decorator';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { ListExpensesQueryDto } from './dto/list-expenses-query.dto';

@Controller('expenses')
@UseGuards(CoupleMemberGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  async create(
    @CurrentCouple() coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto[]> {
    return this.expensesService.create(coupleId, user.id, dto);
  }

  @Get()
  async findAll(
    @CurrentCouple() coupleId: string,
    @Query() query: ListExpensesQueryDto,
  ): Promise<ExpenseResponseDto[]> {
    return this.expensesService.findAll(
      coupleId,
      query.referenceMonth,
      query.status,
    );
  }

  @Get(':id')
  async findOne(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.findOne(coupleId, id);
  }

  @Patch(':id')
  async update(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.update(coupleId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.expensesService.remove(coupleId, id);
  }
}
