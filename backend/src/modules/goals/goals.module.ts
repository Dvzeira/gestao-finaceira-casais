import { Module } from '@nestjs/common';
import { CouplesModule } from '../couples/couples.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { GOAL_REPOSITORY } from './interfaces/goal-repository.interface';
import { GoalRepository } from './repositories/goal.repository';
import { GOAL_CONTRIBUTION_REPOSITORY } from './interfaces/goal-contribution-repository.interface';
import { GoalContributionRepository } from './repositories/goal-contribution.repository';

@Module({
  imports: [CouplesModule, NotificationsModule],
  controllers: [GoalsController],
  providers: [
    GoalsService,
    {
      provide: GOAL_REPOSITORY,
      useClass: GoalRepository,
    },
    {
      provide: GOAL_CONTRIBUTION_REPOSITORY,
      useClass: GoalContributionRepository,
    },
  ],
})
export class GoalsModule {}
