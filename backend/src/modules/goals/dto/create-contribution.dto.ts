import { IsDateString, IsNumber, IsPositive } from 'class-validator';

export class CreateContributionDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsDateString()
  contributedAt!: string;
}
