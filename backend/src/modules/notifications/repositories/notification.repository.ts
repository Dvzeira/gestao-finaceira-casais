import { Injectable } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  CreateNotificationData,
  INotificationRepository,
  NotificationEntity,
} from '../interfaces/notification-repository.interface';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationData): Promise<NotificationEntity> {
    const notification = await this.prisma.notification.create({ data });
    return this.toEntity(notification);
  }

  async findByUserId(
    userId: string,
    onlyUnread?: boolean,
  ): Promise<NotificationEntity[]> {
    const where: Prisma.NotificationWhereInput = { userId };
    if (onlyUnread) {
      where.readAt = null;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return notifications.map((notification) => this.toEntity(notification));
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async findById(id: string): Promise<NotificationEntity | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    return notification ? this.toEntity(notification) : null;
  }

  async markAsRead(id: string): Promise<NotificationEntity> {
    const notification = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return this.toEntity(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  private toEntity(notification: Notification): NotificationEntity {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedEntityId: notification.relatedEntityId,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}
