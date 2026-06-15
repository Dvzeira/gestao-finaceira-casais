import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CoupleInviteStatus, CoupleMemberRole } from '@prisma/client';
import { MailService } from '../../infra/mail/mail.service';
import { TokenService } from '../../shared/services/token.service';
import type {
  IUsersRepository,
  UserEntity,
} from '../users/interfaces/users-repository.interface';
import type { ICoupleRepository } from './interfaces/couple-repository.interface';
import type {
  CoupleMemberEntity,
  ICoupleMemberRepository,
} from './interfaces/couple-member-repository.interface';
import type {
  CoupleInviteEntity,
  ICoupleInviteRepository,
} from './interfaces/couple-invite-repository.interface';
import { CouplesService } from './couples.service';

function buildUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    passwordHash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildMember(
  overrides: Partial<CoupleMemberEntity> = {},
): CoupleMemberEntity {
  return {
    id: 'member-1',
    coupleId: 'couple-1',
    userId: 'user-1',
    role: CoupleMemberRole.OWNER,
    joinedAt: new Date(),
    ...overrides,
  };
}

function buildInvite(
  overrides: Partial<CoupleInviteEntity> = {},
): CoupleInviteEntity {
  return {
    id: 'invite-1',
    coupleId: 'couple-1',
    inviterUserId: 'user-1',
    inviteeEmail: 'bob@example.com',
    status: CoupleInviteStatus.PENDING,
    token: 'raw-token',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    createdAt: new Date(),
    ...overrides,
  };
}

describe('CouplesService', () => {
  let couplesService: CouplesService;
  let usersRepository: jest.Mocked<IUsersRepository>;
  let coupleRepository: jest.Mocked<ICoupleRepository>;
  let coupleMemberRepository: jest.Mocked<ICoupleMemberRepository>;
  let coupleInviteRepository: jest.Mocked<ICoupleInviteRepository>;
  let tokenService: jest.Mocked<TokenService>;
  let mailService: jest.Mocked<MailService>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updatePasswordHash: jest.fn(),
    };

    coupleRepository = {
      create: jest.fn(),
      findById: jest.fn(),
    };

    coupleMemberRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findByCoupleId: jest.fn(),
      countByCoupleId: jest.fn(),
    };

    coupleInviteRepository = {
      create: jest.fn(),
      findByToken: jest.fn(),
      updateStatus: jest.fn(),
      findPendingByInviteeEmail: jest.fn(),
      findPendingByCoupleId: jest.fn(),
    };

    tokenService = {
      generateRawToken: jest.fn(),
      hashToken: jest.fn(),
    };

    mailService = {
      sendCoupleInvite: jest.fn(),
    } as unknown as jest.Mocked<MailService>;

    config = {
      get: jest.fn((_key: string, defaultValue?: unknown) => defaultValue),
    } as unknown as jest.Mocked<ConfigService>;

    couplesService = new CouplesService(
      usersRepository,
      coupleRepository,
      coupleMemberRepository,
      coupleInviteRepository,
      tokenService,
      mailService,
      config,
    );
  });

  describe('sendInvite', () => {
    it('cria um novo casal (inviter ainda sem casal) e envia o convite por e-mail', async () => {
      usersRepository.findById.mockResolvedValue(buildUser());
      usersRepository.findByEmail.mockResolvedValue(null);
      coupleMemberRepository.findByUserId.mockResolvedValue(null);
      coupleRepository.create.mockResolvedValue({
        id: 'couple-1',
        name: null,
        createdAt: new Date(),
      });
      coupleMemberRepository.countByCoupleId.mockResolvedValue(1);
      tokenService.generateRawToken.mockReturnValue('raw-token');
      const invite = buildInvite();
      coupleInviteRepository.create.mockResolvedValue(invite);

      const result = await couplesService.sendInvite(
        'user-1',
        'Bob@Example.com',
      );

      expect(coupleRepository.create).toHaveBeenCalledTimes(1);
      expect(coupleMemberRepository.create).toHaveBeenCalledWith({
        coupleId: 'couple-1',
        userId: 'user-1',
        role: CoupleMemberRole.OWNER,
      });
      expect(coupleInviteRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          coupleId: 'couple-1',
          inviterUserId: 'user-1',
          inviteeEmail: 'bob@example.com',
          token: 'raw-token',
        }),
      );
      expect(mailService.sendCoupleInvite).toHaveBeenCalledWith(
        'bob@example.com',
        'Alice',
        expect.stringContaining('raw-token'),
      );
      expect(result).toEqual({
        id: 'invite-1',
        inviteeEmail: 'bob@example.com',
        status: CoupleInviteStatus.PENDING,
        expiresAt: invite.expiresAt,
      });
    });

    it('lança BadRequestException ao convidar o próprio e-mail', async () => {
      usersRepository.findById.mockResolvedValue(buildUser());

      await expect(
        couplesService.sendInvite('user-1', 'alice@example.com'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(coupleInviteRepository.create).not.toHaveBeenCalled();
    });

    it('lança ConflictException quando o convidado já pertence a outro casal', async () => {
      usersRepository.findById.mockResolvedValue(buildUser());
      usersRepository.findByEmail.mockResolvedValue(
        buildUser({ id: 'user-2', email: 'bob@example.com' }),
      );
      coupleMemberRepository.findByUserId.mockResolvedValue(
        buildMember({ userId: 'user-2', coupleId: 'couple-2' }),
      );

      await expect(
        couplesService.sendInvite('user-1', 'bob@example.com'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(coupleInviteRepository.create).not.toHaveBeenCalled();
    });

    it('lança ConflictException quando o casal do convidante já está completo', async () => {
      usersRepository.findById.mockResolvedValue(buildUser());
      usersRepository.findByEmail.mockResolvedValue(null);
      coupleMemberRepository.findByUserId.mockResolvedValue(buildMember());
      coupleMemberRepository.countByCoupleId.mockResolvedValue(2);

      await expect(
        couplesService.sendInvite('user-1', 'bob@example.com'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(coupleInviteRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getMyCouple', () => {
    it('retorna o casal com os dados dos membros', async () => {
      coupleMemberRepository.findByUserId.mockResolvedValue(buildMember());
      coupleRepository.findById.mockResolvedValue({
        id: 'couple-1',
        name: null,
        createdAt: new Date(),
      });
      coupleMemberRepository.findByCoupleId.mockResolvedValue([
        buildMember(),
        buildMember({
          id: 'member-2',
          userId: 'user-2',
          role: CoupleMemberRole.MEMBER,
        }),
      ]);
      usersRepository.findById
        .mockResolvedValueOnce(buildUser())
        .mockResolvedValueOnce(
          buildUser({ id: 'user-2', name: 'Bob', email: 'bob@example.com' }),
        );

      const result = await couplesService.getMyCouple('user-1');

      expect(result.id).toBe('couple-1');
      expect(result.members).toHaveLength(2);
      expect(result.members[1]).toEqual(
        expect.objectContaining({ userId: 'user-2', name: 'Bob' }),
      );
    });

    it('lança NotFoundException quando o usuário não pertence a um casal', async () => {
      coupleMemberRepository.findByUserId.mockResolvedValue(null);

      await expect(couplesService.getMyCouple('user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('listMyInvites', () => {
    it('retorna os convites pendentes para o e-mail do usuário', async () => {
      usersRepository.findById
        .mockResolvedValueOnce(buildUser({ email: 'bob@example.com' }))
        .mockResolvedValueOnce(buildUser({ id: 'user-2', name: 'Alice' }));
      const invite = buildInvite({ inviterUserId: 'user-2' });
      coupleInviteRepository.findPendingByInviteeEmail.mockResolvedValue([
        invite,
      ]);

      const result = await couplesService.listMyInvites('user-1');

      expect(result).toEqual([
        {
          id: 'invite-1',
          token: 'raw-token',
          inviterName: 'Alice',
          expiresAt: invite.expiresAt,
        },
      ]);
    });
  });

  describe('acceptInvite', () => {
    it('adiciona o usuário como MEMBER e marca o convite como ACCEPTED', async () => {
      coupleInviteRepository.findByToken.mockResolvedValue(buildInvite());
      usersRepository.findById.mockResolvedValue(
        buildUser({ email: 'bob@example.com' }),
      );
      coupleMemberRepository.findByUserId.mockResolvedValue(null);

      const result = await couplesService.acceptInvite('user-1', 'raw-token');

      expect(coupleMemberRepository.create).toHaveBeenCalledWith({
        coupleId: 'couple-1',
        userId: 'user-1',
        role: CoupleMemberRole.MEMBER,
      });
      expect(coupleInviteRepository.updateStatus).toHaveBeenCalledWith(
        'invite-1',
        CoupleInviteStatus.ACCEPTED,
      );
      expect(result).toEqual({ coupleId: 'couple-1' });
    });

    it('lança NotFoundException quando o convite não existe', async () => {
      coupleInviteRepository.findByToken.mockResolvedValue(null);

      await expect(
        couplesService.acceptInvite('user-1', 'raw-token'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lança BadRequestException e marca como EXPIRED quando o convite expirou', async () => {
      coupleInviteRepository.findByToken.mockResolvedValue(
        buildInvite({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(
        couplesService.acceptInvite('user-1', 'raw-token'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(coupleInviteRepository.updateStatus).toHaveBeenCalledWith(
        'invite-1',
        CoupleInviteStatus.EXPIRED,
      );
    });

    it('lança ForbiddenException quando o convite não pertence ao usuário autenticado', async () => {
      coupleInviteRepository.findByToken.mockResolvedValue(buildInvite());
      usersRepository.findById.mockResolvedValue(
        buildUser({ email: 'outro@example.com' }),
      );

      await expect(
        couplesService.acceptInvite('user-1', 'raw-token'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lança ConflictException quando o usuário já pertence a um casal', async () => {
      coupleInviteRepository.findByToken.mockResolvedValue(buildInvite());
      usersRepository.findById.mockResolvedValue(
        buildUser({ email: 'bob@example.com' }),
      );
      coupleMemberRepository.findByUserId.mockResolvedValue(buildMember());

      await expect(
        couplesService.acceptInvite('user-1', 'raw-token'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(coupleMemberRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('rejectInvite', () => {
    it('marca o convite como REJECTED', async () => {
      coupleInviteRepository.findByToken.mockResolvedValue(buildInvite());
      usersRepository.findById.mockResolvedValue(
        buildUser({ email: 'bob@example.com' }),
      );

      await couplesService.rejectInvite('user-1', 'raw-token');

      expect(coupleInviteRepository.updateStatus).toHaveBeenCalledWith(
        'invite-1',
        CoupleInviteStatus.REJECTED,
      );
    });
  });
});
