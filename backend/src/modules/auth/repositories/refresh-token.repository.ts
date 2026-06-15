import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CreateRefreshTokenData,
  IRefreshTokenRepository,
  RefreshTokenEntity,
} from '../interfaces/refresh-token-repository.interface';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRefreshTokenData): Promise<RefreshTokenEntity> {
    return this.prisma.refreshToken.create({ data });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
