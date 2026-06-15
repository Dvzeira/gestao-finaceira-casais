import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IncomeType } from '@prisma/client';

export class UpdateIncomeDto {
  @IsOptional()
  @IsEnum(IncomeType)
  type?: IncomeType;

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
  @IsDateString()
  referenceMonth?: string;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;
}
