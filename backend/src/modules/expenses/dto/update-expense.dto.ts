import {
  IsDateString,
  IsEnum,
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
import { ExpenseOwnership, ExpenseStatus } from '@prisma/client';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description?: string;

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
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
