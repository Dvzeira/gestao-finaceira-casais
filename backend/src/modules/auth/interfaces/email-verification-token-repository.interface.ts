// Contrato de persistência para tokens de confirmação de e-mail, armazenados
// como hash com expiração e marcação de uso único.

export interface EmailVerificationTokenEntity {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface CreateEmailVerificationTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export const EMAIL_VERIFICATION_TOKEN_REPOSITORY = Symbol(
  'EMAIL_VERIFICATION_TOKEN_REPOSITORY',
);

export interface IEmailVerificationTokenRepository {
  create(
    data: CreateEmailVerificationTokenData,
  ): Promise<EmailVerificationTokenEntity>;
  findByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationTokenEntity | null>;
  markUsed(id: string): Promise<void>;
}
