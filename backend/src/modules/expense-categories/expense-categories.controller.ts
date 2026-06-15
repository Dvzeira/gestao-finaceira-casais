import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CoupleMemberGuard } from '../couples/guards/couple-member.guard';
import { CurrentCouple } from '../couples/decorators/current-couple.decorator';
import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { ExpenseCategoryResponseDto } from './dto/expense-category-response.dto';

@Controller('expense-categories')
@UseGuards(CoupleMemberGuard)
export class ExpenseCategoriesController {
  constructor(
    private readonly expenseCategoriesService: ExpenseCategoriesService,
  ) {}

  @Get()
  async findAll(
    @CurrentCouple() coupleId: string,
  ): Promise<ExpenseCategoryResponseDto[]> {
    return this.expenseCategoriesService.findAll(coupleId);
  }

  @Post()
  async create(
    @CurrentCouple() coupleId: string,
    @Body() dto: CreateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.create(coupleId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.expenseCategoriesService.remove(coupleId, id);
  }
}
