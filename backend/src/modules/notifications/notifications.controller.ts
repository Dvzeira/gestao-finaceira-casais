import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { UnreadCountResponseDto } from './dto/unread-count-response.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationsService.findAll(user.id, query.onlyUnread);
  }

  @Get('unread-count')
  async countUnread(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UnreadCountResponseDto> {
    return this.notificationsService.countUnread(user.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.notificationsService.markAllAsRead(user.id);
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(user.id, id);
  }
}
