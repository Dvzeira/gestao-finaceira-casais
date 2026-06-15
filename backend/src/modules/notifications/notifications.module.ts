import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NOTIFICATION_REPOSITORY } from './interfaces/notification-repository.interface';
import { NotificationRepository } from './repositories/notification.repository';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: NotificationRepository,
    },
  ],
  exports: [NOTIFICATION_REPOSITORY],
})
export class NotificationsModule {}
