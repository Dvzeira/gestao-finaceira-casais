import { IsDateString, IsOptional } from 'class-validator';

export class MonthlySummaryQueryDto {
  // Mês de referência do resumo (qualquer dia do mês desejado). Quando
  // ausente, o service assume o mês atual.
  @IsOptional()
  @IsDateString()
  referenceMonth?: string;
}
