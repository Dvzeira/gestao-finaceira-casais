import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GoalStatus, NotificationType } from '@prisma/client';
import {
  GOAL_REPOSITORY,
  GoalEntity,
} from './interfaces/goal-repository.interface';
import type { IGoalRepository } from './interfaces/goal-repository.interface';
import { GOAL_CONTRIBUTION_REPOSITORY } from './interfaces/goal-contribution-repository.interface';
import type { IGoalContributionRepository } from './interfaces/goal-contribution-repository.interface';
import { COUPLE_MEMBER_REPOSITORY } from '../couples/interfaces/couple-member-repository.interface';
import type { ICoupleMemberRepository } from '../couples/interfaces/couple-member-repository.interface';
import { NOTIFICATION_REPOSITORY } from '../notifications/interfaces/notification-repository.interface';
import type { INotificationRepository } from '../notifications/interfaces/notification-repository.interface';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalResponseDto } from './dto/goal-response.dto';
import { GoalSplitDto } from './dto/goal-split.dto';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { ContributionResponseDto } from './dto/contribution-response.dto';

// Quantidade mínima de meses considerada no cálculo de aporte mensal, mesmo
// quando a meta já venceu ou vence no mês atual.
const MIN_MONTHS_REMAINING = 1;

@Injectable()
export class GoalsService {
  constructor(
    @Inject(GOAL_REPOSITORY)
    private readonly goalRepository: IGoalRepository,
    @Inject(GOAL_CONTRIBUTION_REPOSITORY)
    private readonly goalContributionRepository: IGoalContributionRepository,
    @Inject(COUPLE_MEMBER_REPOSITORY)
    private readonly coupleMemberRepository: ICoupleMemberRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async create(coupleId: string, dto: CreateGoalDto): Promise<GoalResponseDto> {
    await this.validateSplits(coupleId, dto.splits);

    const goal = await this.goalRepository.create({
      coupleId,
      title: dto.title,
      targetAmount: dto.targetAmount,
      targetDate: new Date(dto.targetDate),
      splits: dto.splits,
    });

    return this.toResponseDto(goal, 0);
  }

  async findAll(coupleId: string): Promise<GoalResponseDto[]> {
    const goals = await this.goalRepository.findByCoupleId(coupleId);
    return Promise.all(
      goals.map(async (goal) => {
        const totalContributed =
          await this.goalContributionRepository.sumByGoalId(goal.id);
        return this.toResponseDto(goal, totalContributed);
      }),
    );
  }

  async findOne(coupleId: string, id: string): Promise<GoalResponseDto> {
    const goal = await this.loadOwnedGoal(coupleId, id);
    const totalContributed = await this.goalContributionRepository.sumByGoalId(
      goal.id,
    );
    return this.toResponseDto(goal, totalContributed);
  }

  async update(
    coupleId: string,
    id: string,
    dto: UpdateGoalDto,
  ): Promise<GoalResponseDto> {
    await this.loadOwnedGoal(coupleId, id);

    if (dto.splits) {
      await this.validateSplits(coupleId, dto.splits);
    }

    const updated = await this.goalRepository.update(id, {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.targetAmount !== undefined
        ? { targetAmount: dto.targetAmount }
        : {}),
      ...(dto.targetDate !== undefined
        ? { targetDate: new Date(dto.targetDate) }
        : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.splits !== undefined ? { splits: dto.splits } : {}),
    });

    const totalContributed =
      await this.goalContributionRepository.sumByGoalId(id);
    return this.toResponseDto(updated, totalContributed);
  }

  async remove(coupleId: string, id: string): Promise<void> {
    await this.loadOwnedGoal(coupleId, id);
    await this.goalRepository.delete(id);
  }

  // Registra uma contribuição e marca a meta como ACHIEVED automaticamente
  // quando o total contribuído alcança o valor alvo.
  async addContribution(
    coupleId: string,
    goalId: string,
    userId: string,
    dto: CreateContributionDto,
  ): Promise<ContributionResponseDto> {
    const goal = await this.loadOwnedGoal(coupleId, goalId);

    const contribution = await this.goalContributionRepository.create({
      goalId,
      userId,
      amount: dto.amount,
      contributedAt: new Date(dto.contributedAt),
    });

    const totalContributed =
      await this.goalContributionRepository.sumByGoalId(goalId);

    if (
      goal.status === GoalStatus.IN_PROGRESS &&
      totalContributed >= goal.targetAmount
    ) {
      await this.goalRepository.update(goalId, {
        status: GoalStatus.ACHIEVED,
      });
      await this.notifyGoalAchieved(coupleId, goal);
    }

    return this.toContributionResponseDto(contribution);
  }

  async findContributions(
    coupleId: string,
    goalId: string,
  ): Promise<ContributionResponseDto[]> {
    await this.loadOwnedGoal(coupleId, goalId);
    const contributions =
      await this.goalContributionRepository.findByGoalId(goalId);
    return contributions.map((contribution) =>
      this.toContributionResponseDto(contribution),
    );
  }

  // Remove a contribuição e, se a meta estava ACHIEVED e o total cai abaixo
  // do valor alvo, volta o status para IN_PROGRESS.
  async removeContribution(
    coupleId: string,
    goalId: string,
    contributionId: string,
  ): Promise<void> {
    const goal = await this.loadOwnedGoal(coupleId, goalId);

    const contribution =
      await this.goalContributionRepository.findById(contributionId);
    if (!contribution || contribution.goalId !== goalId) {
      throw new NotFoundException('Contribuição não encontrada.');
    }

    await this.goalContributionRepository.delete(contributionId);

    const totalContributed =
      await this.goalContributionRepository.sumByGoalId(goalId);

    if (
      goal.status === GoalStatus.ACHIEVED &&
      totalContributed < goal.targetAmount
    ) {
      await this.goalRepository.update(goalId, {
        status: GoalStatus.IN_PROGRESS,
      });
    }
  }

  // Garante que a soma dos percentuais é 100, sem duplicidade de usuário e
  // que cada userId pertence ao casal autenticado.
  private async validateSplits(
    coupleId: string,
    splits: GoalSplitDto[],
  ): Promise<void> {
    const userIds = splits.map((split) => split.userId);
    if (new Set(userIds).size !== userIds.length) {
      throw new BadRequestException(
        'Não é possível repetir o mesmo usuário em splits.',
      );
    }

    const totalPercentage = splits.reduce(
      (sum, split) => sum + split.percentage,
      0,
    );
    if (Math.round(totalPercentage * 100) / 100 !== 100) {
      throw new BadRequestException(
        'A soma dos percentuais de contribuição deve ser 100.',
      );
    }

    const members = await this.coupleMemberRepository.findByCoupleId(coupleId);
    const memberUserIds = new Set(members.map((member) => member.userId));
    const hasInvalidUser = userIds.some((userId) => !memberUserIds.has(userId));
    if (hasInvalidUser) {
      throw new BadRequestException(
        'Todos os usuários do split devem pertencer ao casal.',
      );
    }
  }

  // Notifica todos os membros do casal quando uma meta é alcançada.
  private async notifyGoalAchieved(
    coupleId: string,
    goal: GoalEntity,
  ): Promise<void> {
    const members = await this.coupleMemberRepository.findByCoupleId(coupleId);
    await Promise.all(
      members.map((member) =>
        this.notificationRepository.create({
          userId: member.userId,
          type: NotificationType.GOAL_ACHIEVED,
          title: 'Meta alcançada!',
          message: `A meta "${goal.title}" foi alcançada.`,
          relatedEntityId: goal.id,
        }),
      ),
    );
  }

  private async loadOwnedGoal(
    coupleId: string,
    id: string,
  ): Promise<GoalEntity> {
    const goal = await this.goalRepository.findById(id);
    if (!goal || goal.coupleId !== coupleId) {
      throw new NotFoundException('Meta financeira não encontrada.');
    }
    return goal;
  }

  private toResponseDto(
    goal: GoalEntity,
    totalContributed: number,
  ): GoalResponseDto {
    const remainingAmount = Math.max(goal.targetAmount - totalContributed, 0);
    const progressPercentage =
      goal.targetAmount > 0
        ? Math.min(
            Math.round((totalContributed / goal.targetAmount) * 10000) / 100,
            100,
          )
        : 0;
    const monthsRemaining = this.monthsUntil(goal.targetDate);

    return {
      id: goal.id,
      title: goal.title,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      status: goal.status,
      splits: goal.splits,
      totalContributed,
      remainingAmount,
      progressPercentage,
      monthsRemaining,
      monthlyContributionTargets: goal.splits.map((split) => ({
        userId: split.userId,
        amount:
          Math.round(
            ((remainingAmount * split.percentage) / 100 / monthsRemaining) *
              100,
          ) / 100,
      })),
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
  }

  // Meses entre agora e targetDate (UTC), com mínimo de 1 para evitar divisão
  // por zero/negativo em metas vencidas ou que vencem no mês atual.
  private monthsUntil(targetDate: Date): number {
    const now = new Date();
    const months =
      (targetDate.getUTCFullYear() - now.getUTCFullYear()) * 12 +
      (targetDate.getUTCMonth() - now.getUTCMonth());
    return Math.max(months, MIN_MONTHS_REMAINING);
  }

  private toContributionResponseDto(contribution: {
    id: string;
    goalId: string;
    userId: string;
    amount: number;
    contributedAt: Date;
    createdAt: Date;
  }): ContributionResponseDto {
    return {
      id: contribution.id,
      goalId: contribution.goalId,
      userId: contribution.userId,
      amount: contribution.amount,
      contributedAt: contribution.contributedAt,
      createdAt: contribution.createdAt,
    };
  }
}
