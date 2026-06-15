// Contrato de persistência para refresh tokens (JWT de longa duração),
// armazenados como hash para permitir revogação e rotação.

export interface RefreshTokenEntity {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface CreateRefreshTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface IRefreshTokenRepository {
  create(data: CreateRefreshTokenData): Promise<RefreshTokenEntity>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
