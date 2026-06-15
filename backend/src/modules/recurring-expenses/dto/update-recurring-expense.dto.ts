import {
  IsBoolean,
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
} from 'class-validator';
import { ExpenseOwnership, RecurringFrequency } from '@prisma/client';

export class UpdateRecurringExpenseDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  templateDescription?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(ExpenseOwnership)
  ownership?: ExpenseOwnership;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sharedSplitPercentageA?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sharedSplitPercentageB?: number;

  @IsOptional()
  @IsEnum(RecurringFrequency)
  frequency?: RecurringFrequency;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
