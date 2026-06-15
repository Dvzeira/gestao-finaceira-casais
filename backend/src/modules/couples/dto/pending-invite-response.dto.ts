export class PendingInviteResponseDto {
  id!: string;
  token!: string;
  inviterName!: string;
  expiresAt!: Date;
}
