export interface GoalContributionEntity {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  contributedAt: Date;
  createdAt: Date;
}

export interface CreateContributionData {
  goalId: string;
  userId: string;
  amount: number;
  contributedAt: Date;
}

export const GOAL_CONTRIBUTION_REPOSITORY = Symbol(
  'GOAL_CONTRIBUTION_REPOSITORY',
);

export interface IGoalContributionRepository {
  create(data: CreateContributionData): Promise<GoalContributionEntity>;
  findById(id: string): Promise<GoalContributionEntity | null>;
  findByGoalId(goalId: string): Promise<GoalContributionEntity[]>;
  sumByGoalId(goalId: string): Promise<number>;
  delete(id: string): Promise<void>;
}
