import { Injectable } from '@nestjs/common';
import { FinancialGoal, GoalContributionSplit } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CreateGoalData,
  GoalEntity,
  IGoalRepository,
  UpdateGoalData,
} from '../interfaces/goal-repository.interface';

type GoalWithSplits = FinancialGoal & { splits: GoalContributionSplit[] };

@Injectable()
export class GoalRepository implements IGoalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateGoalData): Promise<GoalEntity> {
    const goal = await this.prisma.financialGoal.create({
      data: {
        coupleId: data.coupleId,
        title: data.title,
        targetAmount: data.targetAmount,
        targetDate: data.targetDate,
        splits: {
          create: data.splits.map((split) => ({
            userId: split.userId,
            percentage: split.percentage,
          })),
        },
      },
      include: { splits: true },
    });
    return this.toEntity(goal);
  }

  async findById(id: string): Promise<GoalEntity | null> {
    const goal = await this.prisma.financialGoal.findUnique({
      where: { id },
      include: { splits: true },
    });
    return goal ? this.toEntity(goal) : null;
  }

  async findByCoupleId(coupleId: string): Promise<GoalEntity[]> {
    const goals = await this.prisma.financialGoal.findMany({
      where: { coupleId },
      include: { splits: true },
      orderBy: { targetDate: 'asc' },
    });
    return goals.map((goal) => this.toEntity(goal));
  }

  // Quando splits é informado, substitui todos os splits existentes da meta
  // dentro de uma transação, garantindo que a soma permaneça consistente.
  async update(id: string, data: UpdateGoalData): Promise<GoalEntity> {
    const { splits, ...goalData } = data;

    const goal = await this.prisma.$transaction(async (tx) => {
      if (splits) {
        await tx.goalContributionSplit.deleteMany({ where: { goalId: id } });
        await tx.goalContributionSplit.createMany({
          data: splits.map((split) => ({
            goalId: id,
            userId: split.userId,
            percentage: split.percentage,
          })),
        });
      }

      return tx.financialGoal.update({
        where: { id },
        data: goalData,
        include: { splits: true },
      });
    });

    return this.toEntity(goal);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.financialGoal.delete({ where: { id } });
  }

  private toEntity(goal: GoalWithSplits): GoalEntity {
    return {
      id: goal.id,
      coupleId: goal.coupleId,
      title: goal.title,
      targetAmount: Number(goal.targetAmount),
      targetDate: goal.targetDate,
      status: goal.status,
      splits: goal.splits.map((split) => ({
        userId: split.userId,
        percentage: Number(split.percentage),
      })),
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
  }
}
