import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { CouplesService } from './couples.service';
import { AcceptInviteResponseDto } from './dto/accept-invite-response.dto';
import { CoupleResponseDto } from './dto/couple-response.dto';
import { InviteResponseDto } from './dto/invite-response.dto';
import { PendingInviteResponseDto } from './dto/pending-invite-response.dto';
import { SendInviteDto } from './dto/send-invite.dto';

@Controller('couples')
export class CouplesController {
  constructor(private readonly couplesService: CouplesService) {}

  @Post('invite')
  async sendInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendInviteDto,
  ): Promise<InviteResponseDto> {
    return this.couplesService.sendInvite(user.id, dto.inviteeEmail);
  }

  @Get('me')
  async getMyCouple(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CoupleResponseDto> {
    return this.couplesService.getMyCouple(user.id);
  }

  @Get('invites')
  async listMyInvites(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PendingInviteResponseDto[]> {
    return this.couplesService.listMyInvites(user.id);
  }

  @Post('invites/:token/accept')
  @HttpCode(HttpStatus.OK)
  async acceptInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('token') token: string,
  ): Promise<AcceptInviteResponseDto> {
    return this.couplesService.acceptInvite(user.id, token);
  }

  @Post('invites/:token/reject')
  @HttpCode(HttpStatus.OK)
  async rejectInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('token') token: string,
  ): Promise<void> {
    await this.couplesService.rejectInvite(user.id, token);
  }
}
