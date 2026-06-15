import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListNotificationsQueryDto {
  // Aceita "true"/"false" via query string e converte para boolean.
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  onlyUnread?: boolean;
}
