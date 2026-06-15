import { Module } from '@nestjs/common';
import { CouplesModule } from '../couples/couples.module';
import { ExpenseCategoriesModule } from '../expense-categories/expense-categories.module';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { EXPENSE_REPOSITORY } from './interfaces/expense-repository.interface';
import { ExpenseRepository } from './repositories/expense.repository';

@Module({
  imports: [CouplesModule, ExpenseCategoriesModule],
  controllers: [ExpensesController],
  providers: [
    ExpensesService,
    {
      provide: EXPENSE_REPOSITORY,
      useClass: ExpenseRepository,
    },
  ],
})
export class ExpensesModule {}
