import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CoupleMemberEntity,
  CreateCoupleMemberData,
  ICoupleMemberRepository,
} from '../interfaces/couple-member-repository.interface';

@Injectable()
export class CoupleMemberRepository implements ICoupleMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCoupleMemberData): Promise<CoupleMemberEntity> {
    return this.prisma.coupleMember.create({ data });
  }

  async findByUserId(userId: string): Promise<CoupleMemberEntity | null> {
    return this.prisma.coupleMember.findUnique({ where: { userId } });
  }

  async findByCoupleId(coupleId: string): Promise<CoupleMemberEntity[]> {
    return this.prisma.coupleMember.findMany({
      where: { coupleId },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async countByCoupleId(coupleId: string): Promise<number> {
    return this.prisma.coupleMember.count({ where: { coupleId } });
  }
}
