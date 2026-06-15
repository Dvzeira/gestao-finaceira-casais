import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// Extrai o coupleId anexado à requisição pelo CoupleMemberGuard.
export const CurrentCouple = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { coupleId: string }>();
    return request.coupleId;
  },
);
