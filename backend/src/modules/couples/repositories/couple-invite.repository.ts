import { Injectable } from '@nestjs/common';
import { CoupleInviteStatus } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CoupleInviteEntity,
  CreateCoupleInviteData,
  ICoupleInviteRepository,
} from '../interfaces/couple-invite-repository.interface';

@Injectable()
export class CoupleInviteRepository implements ICoupleInviteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCoupleInviteData): Promise<CoupleInviteEntity> {
    return this.prisma.coupleInvite.create({ data });
  }

  async findByToken(token: string): Promise<CoupleInviteEntity | null> {
    return this.prisma.coupleInvite.findUnique({ where: { token } });
  }

  async updateStatus(id: string, status: CoupleInviteStatus): Promise<void> {
    await this.prisma.coupleInvite.update({ where: { id }, data: { status } });
  }

  async findPendingByInviteeEmail(
    email: string,
  ): Promise<CoupleInviteEntity[]> {
    return this.prisma.coupleInvite.findMany({
      where: { inviteeEmail: email, status: CoupleInviteStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingByCoupleId(coupleId: string): Promise<CoupleInviteEntity[]> {
    return this.prisma.coupleInvite.findMany({
      where: { coupleId, status: CoupleInviteStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
  }
}
