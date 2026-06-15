import { CoupleMemberRole } from '@prisma/client';

export class CoupleMemberResponseDto {
  userId!: string;
  name!: string;
  email!: string;
  role!: CoupleMemberRole;
  joinedAt!: Date;
}

export class CoupleResponseDto {
  id!: string;
  name!: string | null;
  members!: CoupleMemberResponseDto[];
}
