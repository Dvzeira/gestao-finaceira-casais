import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { USERS_REPOSITORY } from '../../users/interfaces/users-repository.interface';
import type { IUsersRepository } from '../../users/interfaces/users-repository.interface';
import { AuthenticatedUser } from '../../../shared/interfaces/authenticated-user.interface';

interface AccessTokenPayload {
  sub: string;
}

// Valida o access token JWT enviado no header Authorization e carrega o
// usuário correspondente, anexando-o a request.user para os Controllers.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET', ''),
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    const user = await this.usersRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    return { id: user.id, name: user.name, email: user.email };
  }
}
