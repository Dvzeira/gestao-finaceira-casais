import { Module } from '@nestjs/common';
import { CouplesModule } from '../couples/couples.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { REPORTS_REPOSITORY } from './interfaces/reports-repository.interface';
import { ReportsRepository } from './repositories/reports.repository';

@Module({
  imports: [CouplesModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    {
      provide: REPORTS_REPOSITORY,
      useClass: ReportsRepository,
    },
  ],
})
export class ReportsModule {}
