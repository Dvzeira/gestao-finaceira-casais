import { IsNumber, IsUUID, Max, Min } from 'class-validator';

export class GoalSplitDto {
  @IsUUID()
  userId!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentage!: number;
}
