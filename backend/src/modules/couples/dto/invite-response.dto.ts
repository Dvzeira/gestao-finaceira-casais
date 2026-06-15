import { CoupleInviteStatus } from '@prisma/client';

export class InviteResponseDto {
  id!: string;
  inviteeEmail!: string;
  status!: CoupleInviteStatus;
  expiresAt!: Date;
}
