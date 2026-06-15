import { http } from '@/lib/http';
import type {
  Contribution,
  CreateContributionPayload,
  CreateGoalPayload,
  Goal,
  UpdateGoalPayload,
} from '@/types/goals';

export async function listGoals(): Promise<Goal[]> {
  const { data } = await http.get<Goal[]>('/goals');
  return data;
}

export async function getGoal(id: string): Promise<Goal> {
  const { data } = await http.get<Goal>(`/goals/${id}`);
  return data;
}

export async function createGoal(payload: CreateGoalPayload): Promise<Goal> {
  const { data } = await http.post<Goal>('/goals', payload);
  return data;
}

export async function updateGoal(id: string, payload: UpdateGoalPayload): Promise<Goal> {
  const { data } = await http.patch<Goal>(`/goals/${id}`, payload);
  return data;
}

export async function deleteGoal(id: string): Promise<void> {
  await http.delete(`/goals/${id}`);
}

export async function listContributions(goalId: string): Promise<Contribution[]> {
  const { data } = await http.get<Contribution[]>(`/goals/${goalId}/contributions`);
  return data;
}

export async function addContribution(
  goalId: string,
  payload: CreateContributionPayload,
): Promise<Contribution> {
  const { data } = await http.post<Contribution>(`/goals/${goalId}/contributions`, payload);
  return data;
}

export async function removeContribution(goalId: string, contributionId: string): Promise<void> {
  await http.delete(`/goals/${goalId}/contributions/${contributionId}`);
}
