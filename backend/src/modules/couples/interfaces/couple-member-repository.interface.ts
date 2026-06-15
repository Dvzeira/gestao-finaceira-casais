import { CoupleMemberRole } from '@prisma/client';

// Contrato de persistência da relação User <-> Couple (papel OWNER/MEMBER).
// userId é único: cada usuário pertence a no máximo um casal ativo.

export interface CoupleMemberEntity {
  id: string;
  coupleId: string;
  userId: string;
  role: CoupleMemberRole;
  joinedAt: Date;
}

export interface CreateCoupleMemberData {
  coupleId: string;
  userId: string;
  role: CoupleMemberRole;
}

export const COUPLE_MEMBER_REPOSITORY = Symbol('COUPLE_MEMBER_REPOSITORY');

export interface ICoupleMemberRepository {
  create(data: CreateCoupleMemberData): Promise<CoupleMemberEntity>;
  findByUserId(userId: string): Promise<CoupleMemberEntity | null>;
  findByCoupleId(coupleId: string): Promise<CoupleMemberEntity[]>;
  countByCoupleId(coupleId: string): Promise<number>;
}
