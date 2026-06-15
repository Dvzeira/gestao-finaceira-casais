import { CategoryExpenseDto } from './category-expense.dto';

export class MonthlySummaryResponseDto {
  referenceMonth!: Date;
  totalIncome!: number;
  totalExpense!: number;
  balance!: number;
  expensesByCategory!: CategoryExpenseDto[];
}
