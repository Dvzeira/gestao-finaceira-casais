import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ExpenseOwnership } from '@prisma/client';

export class CreateExpenseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description!: string;

  // Valor de cada parcela quando installmentTotal for informado.
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsUUID()
  categoryId!: string;

  @IsEnum(ExpenseOwnership)
  ownership!: ExpenseOwnership;

  @ValidateIf(
    (dto: CreateExpenseDto) => dto.ownership === ExpenseOwnership.INDIVIDUAL,
  )
  @IsUUID()
  ownerUserId?: string;

  @ValidateIf(
    (dto: CreateExpenseDto) => dto.ownership === ExpenseOwnership.SHARED,
  )
  @IsNumber()
  @Min(0)
  @Max(100)
  sharedSplitPercentageA?: number;

  @ValidateIf(
    (dto: CreateExpenseDto) => dto.ownership === ExpenseOwnership.SHARED,
  )
  @IsNumber()
  @Min(0)
  @Max(100)
  sharedSplitPercentageB?: number;

  @IsDateString()
  dueDate!: string;

  // Quando informado (>= 2), gera N parcelas mensais a partir de dueDate.
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(360)
  installmentTotal?: number;
}
