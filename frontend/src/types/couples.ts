// Tipos espelhando os DTOs do módulo Couples do backend.

export type CoupleMemberRole = 'OWNER' | 'MEMBER';
export type CoupleInviteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface CoupleMember {
  userId: string;
  name: string;
  email: string;
  role: CoupleMemberRole;
  joinedAt: string;
}

export interface Couple {
  id: string;
  name: string | null;
  members: CoupleMember[];
}

export interface PendingInvite {
  id: string;
  token: string;
  inviterName: string;
  expiresAt: string;
}

export interface CoupleInvite {
  id: string;
  inviteeEmail: string;
  status: CoupleInviteStatus;
  expiresAt: string;
}

export interface AcceptInviteResponse {
  coupleId: string;
}
