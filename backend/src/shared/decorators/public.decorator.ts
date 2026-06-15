import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Marca uma rota como pública, dispensando o JwtAuthGuard global
// (ex: register, login, confirm-email, forgot/reset-password).
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
