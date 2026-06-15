// Tipos espelhando os DTOs do módulo `goals` do backend.

export type GoalStatus = 'IN_PROGRESS' | 'ACHIEVED' | 'CANCELLED';

export interface GoalSplit {
  userId: string;
  percentage: number;
}

export interface MonthlyContributionTarget {
  userId: string;
  amount: number;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  targetDate: string;
  status: GoalStatus;
  splits: GoalSplit[];
  totalContributed: number;
  remainingAmount: number;
  progressPercentage: number;
  monthsRemaining: number;
  monthlyContributionTargets: MonthlyContributionTarget[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalPayload {
  title: string;
  targetAmount: number;
  targetDate: string;
  splits: GoalSplit[];
}

export interface UpdateGoalPayload {
  title?: string;
  targetAmount?: number;
  targetDate?: string;
  status?: GoalStatus;
  splits?: GoalSplit[];
}

export interface Contribution {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  contributedAt: string;
  createdAt: string;
}

export interface CreateContributionPayload {
  amount: number;
  contributedAt: string;
}
