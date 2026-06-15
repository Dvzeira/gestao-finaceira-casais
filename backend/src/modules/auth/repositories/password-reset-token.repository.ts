import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CreatePasswordResetTokenData,
  IPasswordResetTokenRepository,
  PasswordResetTokenEntity,
} from '../interfaces/password-reset-token-repository.interface';

@Injectable()
export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreatePasswordResetTokenData,
  ): Promise<PasswordResetTokenEntity> {
    return this.prisma.passwordResetToken.create({ data });
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetTokenEntity | null> {
    return this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
