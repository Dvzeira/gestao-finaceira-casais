// Contrato de persistência do domínio ExpenseCategory. Implementado por
// ExpenseCategoryRepository (Prisma) e injetado via token
// EXPENSE_CATEGORY_REPOSITORY, permitindo mocks em testes.

export interface ExpenseCategoryEntity {
  id: string;
  coupleId: string | null;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface CreateExpenseCategoryData {
  coupleId: string;
  name: string;
  icon?: string;
  color?: string;
}

export const EXPENSE_CATEGORY_REPOSITORY = Symbol(
  'EXPENSE_CATEGORY_REPOSITORY',
);

export interface IExpenseCategoryRepository {
  // Retorna as categorias globais (coupleId nulo) e as próprias do casal.
  findAllForCouple(coupleId: string): Promise<ExpenseCategoryEntity[]>;
  findById(id: string): Promise<ExpenseCategoryEntity | null>;
  findByCoupleIdAndName(
    coupleId: string | null,
    name: string,
  ): Promise<ExpenseCategoryEntity | null>;
  create(data: CreateExpenseCategoryData): Promise<ExpenseCategoryEntity>;
  delete(id: string): Promise<void>;
}
