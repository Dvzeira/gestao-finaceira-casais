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
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { IncomeResponseDto } from './dto/income-response.dto';
import { ListIncomesQueryDto } from './dto/list-incomes-query.dto';

@Controller('incomes')
@UseGuards(CoupleMemberGuard)
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Post()
  async create(
    @CurrentCouple() coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIncomeDto,
  ): Promise<IncomeResponseDto> {
    return this.incomesService.create(coupleId, user.id, dto);
  }

  @Get()
  async findAll(
    @CurrentCouple() coupleId: string,
    @Query() query: ListIncomesQueryDto,
  ): Promise<IncomeResponseDto[]> {
    return this.incomesService.findAll(coupleId, query.referenceMonth);
  }

  @Get(':id')
  async findOne(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
  ): Promise<IncomeResponseDto> {
    return this.incomesService.findOne(coupleId, id);
  }

  @Patch(':id')
  async update(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateIncomeDto,
  ): Promise<IncomeResponseDto> {
    return this.incomesService.update(coupleId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.incomesService.remove(coupleId, id);
  }
}
