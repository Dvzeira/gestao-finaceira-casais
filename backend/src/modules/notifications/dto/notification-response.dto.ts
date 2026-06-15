import { NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  id!: string;
  type!: NotificationType;
  title!: string;
  message!: string;
  relatedEntityId!: string | null;
  readAt!: Date | null;
  createdAt!: Date;
}
