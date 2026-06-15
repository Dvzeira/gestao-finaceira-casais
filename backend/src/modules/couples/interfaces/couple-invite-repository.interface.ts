import { CoupleInviteStatus } from '@prisma/client';

// Contrato de persistência dos convites de casal (token único, com
// expiração e status PENDING/ACCEPTED/REJECTED/EXPIRED).

export interface CoupleInviteEntity {
  id: string;
  coupleId: string;
  inviterUserId: string;
  inviteeEmail: string;
  status: CoupleInviteStatus;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateCoupleInviteData {
  coupleId: string;
  inviterUserId: string;
  inviteeEmail: string;
  token: string;
  expiresAt: Date;
}

export const COUPLE_INVITE_REPOSITORY = Symbol('COUPLE_INVITE_REPOSITORY');

export interface ICoupleInviteRepository {
  create(data: CreateCoupleInviteData): Promise<CoupleInviteEntity>;
  findByToken(token: string): Promise<CoupleInviteEntity | null>;
  updateStatus(id: string, status: CoupleInviteStatus): Promise<void>;
  findPendingByInviteeEmail(email: string): Promise<CoupleInviteEntity[]>;
  findPendingByCoupleId(coupleId: string): Promise<CoupleInviteEntity[]>;
}
