import { Module } from '@nestjs/common';
import { CouplesModule } from '../couples/couples.module';
import { ExpenseCategoriesModule } from '../expense-categories/expense-categories.module';
import { RecurringExpensesController } from './recurring-expenses.controller';
import { RecurringExpensesService } from './recurring-expenses.service';
import { RECURRING_EXPENSE_REPOSITORY } from './interfaces/recurring-expense-repository.interface';
import { RecurringExpenseRepository } from './repositories/recurring-expense.repository';

@Module({
  imports: [CouplesModule, ExpenseCategoriesModule],
  controllers: [RecurringExpensesController],
  providers: [
    RecurringExpensesService,
    {
      provide: RECURRING_EXPENSE_REPOSITORY,
      useClass: RecurringExpenseRepository,
    },
  ],
  exports: [RECURRING_EXPENSE_REPOSITORY],
})
export class RecurringExpensesModule {}
