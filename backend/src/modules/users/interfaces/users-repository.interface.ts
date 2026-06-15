// Contrato de persistência do domínio User. Implementado por UsersRepository
// (Prisma) e injetado via token USERS_REPOSITORY, permitindo mocks em testes.

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface IUsersRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
}
