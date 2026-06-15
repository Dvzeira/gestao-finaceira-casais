import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CashFlowQueryDto {
  // Quantidade de meses (incluindo o mês atual) considerados no relatório de
  // fluxo de caixa. Padrão definido no service quando ausente.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  months?: number;
}
