import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../../infra/mail/mail.service';
import { USERS_REPOSITORY } from '../users/interfaces/users-repository.interface';
import type { IUsersRepository } from '../users/interfaces/users-repository.interface';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './interfaces/password-reset-token-repository.interface';
import type { IPasswordResetTokenRepository } from './interfaces/password-reset-token-repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from './interfaces/refresh-token-repository.interface';
import type { IRefreshTokenRepository } from './interfaces/refresh-token-repository.interface';
import { PasswordService } from './services/password.service';
import { TokenService } from '../../shared/services/token.service';
import { JwtDuration } from '../../shared/types/jwt-duration.type';

const PASSWORD_RESET_TOKEN_TTL_HOURS = 1;

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenPayload {
  sub: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // Cria o usuário com senha hasheada e já emite o par de tokens (access +
  // refresh), permitindo que o cliente entre direto no sistema após o cadastro.
  async register(data: RegisterData): Promise<AuthTokens> {
    const existingUser = await this.usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Já existe uma conta com este e-mail.');
    }

    const passwordHash = await this.passwordService.hash(data.password);
    const user = await this.usersRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
    });

    return this.issueTokens(user.id);
  }

  // Valida e-mail/senha e emite o par de tokens (access + refresh).
  async login(data: LoginData): Promise<AuthTokens> {
    const user = await this.usersRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const passwordMatches = await this.passwordService.compare(
      data.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    return this.issueTokens(user.id);
  }

  // Gera um novo access token a partir de um refresh token válido, com
  // rotação: o refresh token usado é revogado e um novo é emitido.
  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        rawRefreshToken,
        {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    const tokenHash = this.tokenService.hashToken(rawRefreshToken);
    const storedToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    await this.refreshTokenRepository.revoke(storedToken.id);

    return this.issueTokens(payload.sub);
  }

  private async issueTokens(userId: string): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<JwtDuration>('JWT_ACCESS_EXPIRES_IN', '15m'),
      },
    );

    const refreshExpiresIn = this.config.get<JwtDuration>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    // jti garante um token único mesmo quando emitido no mesmo segundo que
    // outro (o JWT seria idêntico sem isso, violando o índice único do hash).
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, jti: this.tokenService.generateRawToken() },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      },
    );

    await this.refreshTokenRepository.create({
      userId,
      tokenHash: this.tokenService.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + parseDurationToMs(refreshExpiresIn)),
    });

    return { accessToken, refreshToken };
  }

  // Gera um token de reset de senha e envia por e-mail. Não revela se o
  // e-mail existe ou não na base — sempre responde com sucesso silencioso.
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      return;
    }

    const rawToken = this.tokenService.generateRawToken();
    const tokenHash = this.tokenService.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000,
    );

    await this.passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    // Mesmo princípio do registro: falha no envio não deve virar erro para o
    // cliente, que já recebe sempre uma resposta de sucesso silenciosa.
    try {
      await this.mailService.sendPasswordReset(user.email, resetUrl);
    } catch (error) {
      this.logger.warn(
        `Falha ao enviar e-mail de redefinição de senha para ${user.email}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  // Valida o token de reset (hash + expiração + uso único), atualiza a senha
  // e revoga todos os refresh tokens existentes do usuário por segurança.
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = this.tokenService.hashToken(rawToken);
    const token =
      await this.passwordResetTokenRepository.findByTokenHash(tokenHash);

    if (!token || token.usedAt || token.expiresAt < new Date()) {
      throw new BadRequestException(
        'Token de redefinição inválido ou expirado.',
      );
    }

    const passwordHash = await this.passwordService.hash(newPassword);
    await this.usersRepository.updatePasswordHash(token.userId, passwordHash);
    await this.passwordResetTokenRepository.markUsed(token.id);
    await this.refreshTokenRepository.revokeAllForUser(token.userId);
  }
}

// Converte durações no formato usado pelo @nestjs/jwt (ex: "7d", "15m", "30s")
// para milissegundos, usadas para calcular expiresAt do RefreshToken no banco.
function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    throw new Error(`Formato de duração inválido: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unidade de duração inválida: ${unit}`);
  }
}
