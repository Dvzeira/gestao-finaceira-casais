import { Module } from '@nestjs/common';
import { CouplesModule } from '../couples/couples.module';
import { IncomesController } from './incomes.controller';
import { IncomesService } from './incomes.service';
import { INCOME_REPOSITORY } from './interfaces/income-repository.interface';
import { IncomeRepository } from './repositories/income.repository';

@Module({
  imports: [CouplesModule],
  controllers: [IncomesController],
  providers: [
    IncomesService,
    {
      provide: INCOME_REPOSITORY,
      useClass: IncomeRepository,
    },
  ],
})
export class IncomesModule {}
