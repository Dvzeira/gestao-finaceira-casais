import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import type { AuthenticatedUser } from '../../../shared/interfaces/authenticated-user.interface';
import type { ICoupleMemberRepository } from '../interfaces/couple-member-repository.interface';
import { COUPLE_MEMBER_REPOSITORY } from '../interfaces/couple-member-repository.interface';

// Guard reutilizável pelos módulos de domínio (incomes, expenses, goals):
// garante que o usuário autenticado pertence a um casal e anexa o coupleId
// à requisição, evitando que esse id seja recebido diretamente do cliente.
@Injectable()
export class CoupleMemberGuard implements CanActivate {
  constructor(
    @Inject(COUPLE_MEMBER_REPOSITORY)
    private readonly coupleMemberRepository: ICoupleMemberRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser; coupleId?: string }>();

    const member = await this.coupleMemberRepository.findByUserId(
      request.user.id,
    );

    if (!member) {
      throw new ForbiddenException('Usuário não pertence a um casal.');
    }

    request.coupleId = member.coupleId;
    return true;
  }
}
