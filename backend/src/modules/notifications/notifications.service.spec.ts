import { NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import type {
  INotificationRepository,
  NotificationEntity,
} from './interfaces/notification-repository.interface';
import { NotificationsService } from './notifications.service';

function buildNotification(
  overrides: Partial<NotificationEntity> = {},
): NotificationEntity {
  return {
    id: 'notification-1',
    userId: 'user-1',
    type: NotificationType.GOAL_ACHIEVED,
    title: 'Meta alcançada!',
    message: 'A meta "Viagem" foi alcançada.',
    relatedEntityId: 'goal-1',
    readAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('NotificationsService', () => {
  let notificationsService: NotificationsService;
  let notificationRepository: jest.Mocked<INotificationRepository>;

  beforeEach(() => {
    notificationRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      countUnread: jest.fn(),
      findById: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };

    notificationsService = new NotificationsService(notificationRepository);
  });

  describe('findAll', () => {
    it('retorna as notificações do usuário', async () => {
      notificationRepository.findByUserId.mockResolvedValue([
        buildNotification(),
      ]);

      const result = await notificationsService.findAll('user-1');

      expect(notificationRepository.findByUserId).toHaveBeenCalledWith(
        'user-1',
        undefined,
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('notification-1');
    });

    it('filtra apenas as não lidas quando onlyUnread é true', async () => {
      notificationRepository.findByUserId.mockResolvedValue([]);

      await notificationsService.findAll('user-1', true);

      expect(notificationRepository.findByUserId).toHaveBeenCalledWith(
        'user-1',
        true,
      );
    });
  });

  describe('countUnread', () => {
    it('retorna a contagem de notificações não lidas', async () => {
      notificationRepository.countUnread.mockResolvedValue(3);

      const result = await notificationsService.countUnread('user-1');

      expect(result).toEqual({ count: 3 });
    });
  });

  describe('markAsRead', () => {
    it('lança NotFoundException quando a notificação não pertence ao usuário', async () => {
      notificationRepository.findById.mockResolvedValue(
        buildNotification({ userId: 'user-2' }),
      );

      await expect(
        notificationsService.markAsRead('user-1', 'notification-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(notificationRepository.markAsRead).not.toHaveBeenCalled();
    });

    it('retorna a notificação sem alterar quando já está lida', async () => {
      const readAt = new Date('2026-06-01');
      notificationRepository.findById.mockResolvedValue(
        buildNotification({ readAt }),
      );

      const result = await notificationsService.markAsRead(
        'user-1',
        'notification-1',
      );

      expect(notificationRepository.markAsRead).not.toHaveBeenCalled();
      expect(result.readAt).toBe(readAt);
    });

    it('marca a notificação como lida quando ainda não foi lida', async () => {
      notificationRepository.findById.mockResolvedValue(buildNotification());
      notificationRepository.markAsRead.mockResolvedValue(
        buildNotification({ readAt: new Date('2026-06-01') }),
      );

      const result = await notificationsService.markAsRead(
        'user-1',
        'notification-1',
      );

      expect(notificationRepository.markAsRead).toHaveBeenCalledWith(
        'notification-1',
      );
      expect(result.readAt).not.toBeNull();
    });
  });

  describe('markAllAsRead', () => {
    it('marca todas as notificações do usuário como lidas', async () => {
      await notificationsService.markAllAsRead('user-1');

      expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith(
        'user-1',
      );
    });
  });
});
