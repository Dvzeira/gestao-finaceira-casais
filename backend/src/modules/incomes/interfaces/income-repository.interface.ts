import { IncomeType } from '@prisma/client';

// Contrato de persistência do domínio Income. Implementado por
// IncomeRepository (Prisma) e injetado via token INCOME_REPOSITORY,
// permitindo mocks em testes.

export interface IncomeEntity {
  id: string;
  coupleId: string;
  userId: string;
  type: IncomeType;
  description: string;
  amount: number;
  referenceMonth: Date;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIncomeData {
  coupleId: string;
  userId: string;
  type: IncomeType;
  description: string;
  amount: number;
  referenceMonth: Date;
  receivedAt: Date;
}

export interface UpdateIncomeData {
  type?: IncomeType;
  description?: string;
  amount?: number;
  referenceMonth?: Date;
  receivedAt?: Date;
}

export const INCOME_REPOSITORY = Symbol('INCOME_REPOSITORY');

export interface IIncomeRepository {
  create(data: CreateIncomeData): Promise<IncomeEntity>;
  findById(id: string): Promise<IncomeEntity | null>;
  findByCoupleId(
    coupleId: string,
    referenceMonth?: Date,
  ): Promise<IncomeEntity[]>;
  update(id: string, data: UpdateIncomeData): Promise<IncomeEntity>;
  delete(id: string): Promise<void>;
}
