import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { MailService } from '../../infra/mail/mail.service';
import type {
  IUsersRepository,
  UserEntity,
} from '../users/interfaces/users-repository.interface';
import type { IPasswordResetTokenRepository } from './interfaces/password-reset-token-repository.interface';
import type { IRefreshTokenRepository } from './interfaces/refresh-token-repository.interface';
import { AuthService } from './auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from '../../shared/services/token.service';

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    name: 'Casal Teste',
    email: 'casal@example.com',
    passwordHash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AuthService', () => {
  let authService: AuthService;
  let usersRepository: jest.Mocked<IUsersRepository>;
  let refreshTokenRepository: jest.Mocked<IRefreshTokenRepository>;
  let passwordResetTokenRepository: jest.Mocked<IPasswordResetTokenRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;
  let mailService: jest.Mocked<MailService>;
  let jwtService: jest.Mocked<JwtService>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updatePasswordHash: jest.fn(),
    };

    refreshTokenRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
    };

    passwordResetTokenRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      markUsed: jest.fn(),
    };

    passwordService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    tokenService = {
      generateRawToken: jest.fn(),
      hashToken: jest.fn(),
    };

    mailService = {
      sendPasswordReset: jest.fn(),
    } as unknown as jest.Mocked<MailService>;

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    config = {
      get: jest.fn((_key: string, defaultValue?: unknown) => defaultValue),
    } as unknown as jest.Mocked<ConfigService>;

    authService = new AuthService(
      usersRepository,
      refreshTokenRepository,
      passwordResetTokenRepository,
      passwordService,
      tokenService,
      mailService,
      jwtService,
      config,
    );
  });

  describe('register', () => {
    it('cria o usuário e já retorna access e refresh tokens', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashed-password');
      usersRepository.create.mockResolvedValue(buildUser());
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      tokenService.generateRawToken.mockReturnValue('raw-token');
      tokenService.hashToken.mockReturnValue('hashed-refresh-token');

      const result = await authService.register({
        name: 'Casal Teste',
        email: 'casal@example.com',
        password: 'senha12345',
      });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(usersRepository.create).toHaveBeenCalledWith({
        name: 'Casal Teste',
        email: 'casal@example.com',
        passwordHash: 'hashed-password',
      });
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          tokenHash: 'hashed-refresh-token',
        }),
      );
    });

    it('lança ConflictException se o e-mail já estiver cadastrado', async () => {
      usersRepository.findByEmail.mockResolvedValue(buildUser());

      await expect(
        authService.register({
          name: 'Casal Teste',
          email: 'casal@example.com',
          password: 'senha12345',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(usersRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('retorna access e refresh tokens para credenciais válidas', async () => {
      usersRepository.findByEmail.mockResolvedValue(buildUser());
      passwordService.compare.mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      tokenService.hashToken.mockReturnValue('hashed-refresh-token');

      const result = await authService.login({
        email: 'casal@example.com',
        password: 'senha12345',
      });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          tokenHash: 'hashed-refresh-token',
        }),
      );
    });

    it('lança UnauthorizedException quando o usuário não existe', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'casal@example.com',
          password: 'senha12345',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lança UnauthorizedException quando a senha está incorreta', async () => {
      usersRepository.findByEmail.mockResolvedValue(buildUser());
      passwordService.compare.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'casal@example.com',
          password: 'senha-errada',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rotaciona o refresh token e emite novos tokens', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      tokenService.hashToken.mockReturnValue('hashed-refresh-token');
      refreshTokenRepository.findByTokenHash.mockResolvedValue({
        id: 'refresh-1',
        userId: 'user-1',
        tokenHash: 'hashed-refresh-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        revokedAt: null,
        createdAt: new Date(),
      });
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await authService.refresh('raw-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(refreshTokenRepository.revoke).toHaveBeenCalledWith('refresh-1');
    });

    it('lança UnauthorizedException quando o JWT é inválido', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

      await expect(
        authService.refresh('raw-refresh-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lança UnauthorizedException quando o refresh token foi revogado', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      tokenService.hashToken.mockReturnValue('hashed-refresh-token');
      refreshTokenRepository.findByTokenHash.mockResolvedValue({
        id: 'refresh-1',
        userId: 'user-1',
        tokenHash: 'hashed-refresh-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        revokedAt: new Date(),
        createdAt: new Date(),
      });

      await expect(
        authService.refresh('raw-refresh-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('envia e-mail de reset quando o usuário existe', async () => {
      usersRepository.findByEmail.mockResolvedValue(buildUser());
      tokenService.generateRawToken.mockReturnValue('raw-token');
      tokenService.hashToken.mockReturnValue('hashed-token');

      await authService.forgotPassword('casal@example.com');

      expect(passwordResetTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          tokenHash: 'hashed-token',
        }),
      );
      expect(mailService.sendPasswordReset).toHaveBeenCalledWith(
        'casal@example.com',
        expect.stringContaining('raw-token'),
      );
    });

    it('não revela se o e-mail não existe (silencioso)', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await authService.forgotPassword('inexistente@example.com');

      expect(passwordResetTokenRepository.create).not.toHaveBeenCalled();
      expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('atualiza a senha e revoga refresh tokens existentes', async () => {
      tokenService.hashToken.mockReturnValue('hashed-token');
      passwordResetTokenRepository.findByTokenHash.mockResolvedValue({
        id: 'reset-1',
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        usedAt: null,
        createdAt: new Date(),
      });
      passwordService.hash.mockResolvedValue('new-hashed-password');

      await authService.resetPassword('raw-token', 'nova-senha123');

      expect(usersRepository.updatePasswordHash).toHaveBeenCalledWith(
        'user-1',
        'new-hashed-password',
      );
      expect(passwordResetTokenRepository.markUsed).toHaveBeenCalledWith(
        'reset-1',
      );
      expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('lança BadRequestException quando o token é inválido', async () => {
      tokenService.hashToken.mockReturnValue('hashed-token');
      passwordResetTokenRepository.findByTokenHash.mockResolvedValue(null);

      await expect(
        authService.resetPassword('raw-token', 'nova-senha123'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
