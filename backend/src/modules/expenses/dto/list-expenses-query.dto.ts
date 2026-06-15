import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ExpenseStatus } from '@prisma/client';

export class ListExpensesQueryDto {
  // Quando informado, filtra despesas com dueDate dentro do mês/ano deste
  // valor (qualquer dia do mês desejado) — o dia é ignorado pelo service.
  @IsOptional()
  @IsDateString()
  referenceMonth?: string;

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;
}
