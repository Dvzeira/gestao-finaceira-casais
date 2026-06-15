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
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CoupleMemberGuard } from '../couples/guards/couple-member.guard';
import { CurrentCouple } from '../couples/decorators/current-couple.decorator';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalResponseDto } from './dto/goal-response.dto';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { ContributionResponseDto } from './dto/contribution-response.dto';

@Controller('goals')
@UseGuards(CoupleMemberGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  async create(
    @CurrentCouple() coupleId: string,
    @Body() dto: CreateGoalDto,
  ): Promise<GoalResponseDto> {
    return this.goalsService.create(coupleId, dto);
  }

  @Get()
  async findAll(@CurrentCouple() coupleId: string): Promise<GoalResponseDto[]> {
    return this.goalsService.findAll(coupleId);
  }

  @Get(':id')
  async findOne(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
  ): Promise<GoalResponseDto> {
    return this.goalsService.findOne(coupleId, id);
  }

  @Patch(':id')
  async update(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ): Promise<GoalResponseDto> {
    return this.goalsService.update(coupleId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.goalsService.remove(coupleId, id);
  }

  @Post(':id/contributions')
  async addContribution(
    @CurrentCouple() coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateContributionDto,
  ): Promise<ContributionResponseDto> {
    return this.goalsService.addContribution(coupleId, id, user.id, dto);
  }

  @Get(':id/contributions')
  async findContributions(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
  ): Promise<ContributionResponseDto[]> {
    return this.goalsService.findContributions(coupleId, id);
  }

  @Delete(':id/contributions/:contributionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeContribution(
    @CurrentCouple() coupleId: string,
    @Param('id') id: string,
    @Param('contributionId') contributionId: string,
  ): Promise<void> {
    await this.goalsService.removeContribution(coupleId, id, contributionId);
  }
}
