import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IncomeType } from '@prisma/client';

export class CreateIncomeDto {
  @IsEnum(IncomeType)
  type!: IncomeType;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  // Mês de referência da receita (ex: salário de junho), usado para
  // agrupar receitas por mês no dashboard.
  @IsDateString()
  referenceMonth!: string;

  @IsDateString()
  receivedAt!: string;
}
