import { IsDateString, IsOptional } from 'class-validator';

export class ListIncomesQueryDto {
  // Quando informado, filtra receitas pelo mês/ano deste valor (qualquer dia
  // do mês desejado) — o dia é ignorado pelo service.
  @IsOptional()
  @IsDateString()
  referenceMonth?: string;
}
