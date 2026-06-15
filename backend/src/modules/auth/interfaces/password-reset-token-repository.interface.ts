// Contrato de persistência para tokens de redefinição de senha, armazenados
// como hash com expiração e marcação de uso único.

export interface PasswordResetTokenEntity {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface CreatePasswordResetTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol(
  'PASSWORD_RESET_TOKEN_REPOSITORY',
);

export interface IPasswordResetTokenRepository {
  create(data: CreatePasswordResetTokenData): Promise<PasswordResetTokenEntity>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetTokenEntity | null>;
  markUsed(id: string): Promise<void>;
}
