import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { GoalSplitDto } from './goal-split.dto';

export class CreateGoalDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsNumber()
  @IsPositive()
  targetAmount!: number;

  @IsDateString()
  targetDate!: string;

  // Percentual de contribuição de cada membro do casal; a soma deve ser 100.
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GoalSplitDto)
  splits!: GoalSplitDto[];
}
