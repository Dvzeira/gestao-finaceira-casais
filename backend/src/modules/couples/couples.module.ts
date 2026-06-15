import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TokenService } from '../../shared/services/token.service';
import { CouplesController } from './couples.controller';
import { CouplesService } from './couples.service';
import { COUPLE_REPOSITORY } from './interfaces/couple-repository.interface';
import { CoupleRepository } from './repositories/couple.repository';
import { COUPLE_MEMBER_REPOSITORY } from './interfaces/couple-member-repository.interface';
import { CoupleMemberRepository } from './repositories/couple-member.repository';
import { COUPLE_INVITE_REPOSITORY } from './interfaces/couple-invite-repository.interface';
import { CoupleInviteRepository } from './repositories/couple-invite.repository';
import { CoupleMemberGuard } from './guards/couple-member.guard';

@Module({
  imports: [UsersModule],
  controllers: [CouplesController],
  providers: [
    CouplesService,
    TokenService,
    CoupleMemberGuard,
    {
      provide: COUPLE_REPOSITORY,
      useClass: CoupleRepository,
    },
    {
      provide: COUPLE_MEMBER_REPOSITORY,
      useClass: CoupleMemberRepository,
    },
    {
      provide: COUPLE_INVITE_REPOSITORY,
      useClass: CoupleInviteRepository,
    },
  ],
  exports: [COUPLE_MEMBER_REPOSITORY, CoupleMemberGuard],
})
export class CouplesModule {}
