import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CreateEmailVerificationTokenData,
  EmailVerificationTokenEntity,
  IEmailVerificationTokenRepository,
} from '../interfaces/email-verification-token-repository.interface';

@Injectable()
export class EmailVerificationTokenRepository implements IEmailVerificationTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateEmailVerificationTokenData,
  ): Promise<EmailVerificationTokenEntity> {
    return this.prisma.emailVerificationToken.create({ data });
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<EmailVerificationTokenEntity | null> {
    return this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
