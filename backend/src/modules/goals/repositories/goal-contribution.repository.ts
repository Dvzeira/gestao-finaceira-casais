import { Injectable } from '@nestjs/common';
import { GoalContribution } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CreateContributionData,
  GoalContributionEntity,
  IGoalContributionRepository,
} from '../interfaces/goal-contribution-repository.interface';

@Injectable()
export class GoalContributionRepository implements IGoalContributionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateContributionData): Promise<GoalContributionEntity> {
    const contribution = await this.prisma.goalContribution.create({ data });
    return this.toEntity(contribution);
  }

  async findById(id: string): Promise<GoalContributionEntity | null> {
    const contribution = await this.prisma.goalContribution.findUnique({
      where: { id },
    });
    return contribution ? this.toEntity(contribution) : null;
  }

  async findByGoalId(goalId: string): Promise<GoalContributionEntity[]> {
    const contributions = await this.prisma.goalContribution.findMany({
      where: { goalId },
      orderBy: { contributedAt: 'desc' },
    });
    return contributions.map((contribution) => this.toEntity(contribution));
  }

  async sumByGoalId(goalId: string): Promise<number> {
    const result = await this.prisma.goalContribution.aggregate({
      where: { goalId },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.goalContribution.delete({ where: { id } });
  }

  private toEntity(contribution: GoalContribution): GoalContributionEntity {
    return {
      id: contribution.id,
      goalId: contribution.goalId,
      userId: contribution.userId,
      amount: Number(contribution.amount),
      contributedAt: contribution.contributedAt,
      createdAt: contribution.createdAt,
    };
  }
}
