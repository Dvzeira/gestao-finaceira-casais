import { Module } from '@nestjs/common';
import { CouplesModule } from '../couples/couples.module';
import { ExpenseCategoriesController } from './expense-categories.controller';
import { ExpenseCategoriesService } from './expense-categories.service';
import { EXPENSE_CATEGORY_REPOSITORY } from './interfaces/expense-category-repository.interface';
import { ExpenseCategoryRepository } from './repositories/expense-category.repository';

@Module({
  imports: [CouplesModule],
  controllers: [ExpenseCategoriesController],
  providers: [
    ExpenseCategoriesService,
    {
      provide: EXPENSE_CATEGORY_REPOSITORY,
      useClass: ExpenseCategoryRepository,
    },
  ],
  exports: [EXPENSE_CATEGORY_REPOSITORY],
})
export class ExpenseCategoriesModule {}
