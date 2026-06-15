import { NotificationType } from '@prisma/client';

export interface NotificationEntity {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string | null;
}

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface INotificationRepository {
  create(data: CreateNotificationData): Promise<NotificationEntity>;
  findByUserId(
    userId: string,
    onlyUnread?: boolean,
  ): Promise<NotificationEntity[]>;
  countUnread(userId: string): Promise<number>;
  findById(id: string): Promise<NotificationEntity | null>;
  markAsRead(id: string): Promise<NotificationEntity>;
  markAllAsRead(userId: string): Promise<void>;
}
