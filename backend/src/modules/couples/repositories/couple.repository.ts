import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CoupleEntity,
  ICoupleRepository,
} from '../interfaces/couple-repository.interface';

@Injectable()
export class CoupleRepository implements ICoupleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(): Promise<CoupleEntity> {
    return this.prisma.couple.create({ data: {} });
  }

  async findById(id: string): Promise<CoupleEntity | null> {
    return this.prisma.couple.findUnique({ where: { id } });
  }
}
