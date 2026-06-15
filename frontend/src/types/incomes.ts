// Tipos espelhando os DTOs do módulo `incomes` do backend.

export type IncomeType = 'SALARY' | 'EXTRA';

export interface Income {
  id: string;
  userId: string;
  type: IncomeType;
  description: string;
  amount: number;
  referenceMonth: string;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncomePayload {
  type: IncomeType;
  description: string;
  amount: number;
  referenceMonth: string;
  receivedAt: string;
}

export type UpdateIncomePayload = Partial<CreateIncomePayload>;
