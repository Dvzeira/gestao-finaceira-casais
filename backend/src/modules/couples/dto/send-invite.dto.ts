import { IsEmail } from 'class-validator';

export class SendInviteDto {
  @IsEmail()
  inviteeEmail!: string;
}
