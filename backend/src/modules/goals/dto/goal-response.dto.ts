import { GoalStatus } from '@prisma/client';

export class GoalSplitResponseDto {
  userId!: string;
  percentage!: number;
}

// Quanto cada membro precisa contribuir por mês para atingir a meta no prazo,
// considerando o valor já contribuído e os meses restantes até targetDate.
export class MonthlyContributionTargetDto {
  userId!: string;
  amount!: number;
}

export class GoalResponseDto {
  id!: string;
  title!: string;
  targetAmount!: number;
  targetDate!: Date;
  status!: GoalStatus;
  splits!: GoalSplitResponseDto[];
  totalContributed!: number;
  remainingAmount!: number;
  progressPercentage!: number;
  monthsRemaining!: number;
  monthlyContributionTargets!: MonthlyContributionTargetDto[];
  createdAt!: Date;
  updatedAt!: Date;
}
