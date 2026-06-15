import { GoalStatus } from '@prisma/client';

export interface GoalSplitEntity {
  userId: string;
  percentage: number;
}

export interface GoalEntity {
  id: string;
  coupleId: string;
  title: string;
  targetAmount: number;
  targetDate: Date;
  status: GoalStatus;
  splits: GoalSplitEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGoalData {
  coupleId: string;
  title: string;
  targetAmount: number;
  targetDate: Date;
  splits: GoalSplitEntity[];
}

export interface UpdateGoalData {
  title?: string;
  targetAmount?: number;
  targetDate?: Date;
  status?: GoalStatus;
  splits?: GoalSplitEntity[];
}

export const GOAL_REPOSITORY = Symbol('GOAL_REPOSITORY');

export interface IGoalRepository {
  create(data: CreateGoalData): Promise<GoalEntity>;
  findById(id: string): Promise<GoalEntity | null>;
  findByCoupleId(coupleId: string): Promise<GoalEntity[]>;
  update(id: string, data: UpdateGoalData): Promise<GoalEntity>;
  delete(id: string): Promise<void>;
}
