import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  NotificationEntity,
} from './interfaces/notification-repository.interface';
import type { INotificationRepository } from './interfaces/notification-repository.interface';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { UnreadCountResponseDto } from './dto/unread-count-response.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async findAll(
    userId: string,
    onlyUnread?: boolean,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.findByUserId(
      userId,
      onlyUnread,
    );
    return notifications.map((notification) =>
      this.toResponseDto(notification),
    );
  }

  async countUnread(userId: string): Promise<UnreadCountResponseDto> {
    const count = await this.notificationRepository.countUnread(userId);
    return { count };
  }

  async markAsRead(
    userId: string,
    id: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.loadOwnedNotification(userId, id);
    if (notification.readAt) {
      return this.toResponseDto(notification);
    }

    const updated = await this.notificationRepository.markAsRead(id);
    return this.toResponseDto(updated);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }

  // Garante que a notificação existe e pertence ao usuário autenticado.
  private async loadOwnedNotification(
    userId: string,
    id: string,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notificação não encontrada.');
    }
    return notification;
  }

  private toResponseDto(
    notification: NotificationEntity,
  ): NotificationResponseDto {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedEntityId: notification.relatedEntityId,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}
