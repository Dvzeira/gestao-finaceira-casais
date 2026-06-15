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
import { ExpenseOwnership, RecurringFrequency } from '@prisma/client';

export class CreateRecurringExpenseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  templateDescription!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsUUID()
  categoryId!: string;

  @IsEnum(ExpenseOwnership)
  ownership!: ExpenseOwnership;

  @ValidateIf(
    (dto: CreateRecurringExpenseDto) =>
      dto.ownership === ExpenseOwnership.INDIVIDUAL,
  )
  @IsUUID()
  ownerUserId?: string;

  @ValidateIf(
    (dto: CreateRecurringExpenseDto) =>
      dto.ownership === ExpenseOwnership.SHARED,
  )
  @IsNumber()
  @Min(0)
  @Max(100)
  sharedSplitPercentageA?: number;

  @ValidateIf(
    (dto: CreateRecurringExpenseDto) =>
      dto.ownership === ExpenseOwnership.SHARED,
  )
  @IsNumber()
  @Min(0)
  @Max(100)
  sharedSplitPercentageB?: number;

  @IsEnum(RecurringFrequency)
  frequency!: RecurringFrequency;

  // Dia do mês em que a despesa é gerada (1-31), usado para frequências
  // MONTHLY/YEARLY. Para WEEKLY, o job usa startDate como referência.
  @ValidateIf(
    (dto: CreateRecurringExpenseDto) =>
      dto.frequency === RecurringFrequency.MONTHLY ||
      dto.frequency === RecurringFrequency.YEARLY,
  )
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
