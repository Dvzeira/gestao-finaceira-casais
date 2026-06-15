import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoupleInviteStatus, CoupleMemberRole } from '@prisma/client';
import { MailService } from '../../infra/mail/mail.service';
import { TokenService } from '../../shared/services/token.service';
import { USERS_REPOSITORY } from '../users/interfaces/users-repository.interface';
import type { IUsersRepository } from '../users/interfaces/users-repository.interface';
import { COUPLE_REPOSITORY } from './interfaces/couple-repository.interface';
import type { ICoupleRepository } from './interfaces/couple-repository.interface';
import { COUPLE_MEMBER_REPOSITORY } from './interfaces/couple-member-repository.interface';
import type { ICoupleMemberRepository } from './interfaces/couple-member-repository.interface';
import { COUPLE_INVITE_REPOSITORY } from './interfaces/couple-invite-repository.interface';
import type {
  CoupleInviteEntity,
  ICoupleInviteRepository,
} from './interfaces/couple-invite-repository.interface';

const INVITE_TOKEN_TTL_DAYS = 7;
const MAX_COUPLE_MEMBERS = 2;

export interface InviteSummary {
  id: string;
  inviteeEmail: string;
  status: CoupleInviteEntity['status'];
  expiresAt: Date;
}

export interface CoupleMemberSummary {
  userId: string;
  name: string;
  email: string;
  role: CoupleMemberRole;
  joinedAt: Date;
}

export interface CoupleSummary {
  id: string;
  name: string | null;
  members: CoupleMemberSummary[];
}

export interface PendingInviteSummary {
  id: string;
  token: string;
  inviterName: string;
  expiresAt: Date;
}

@Injectable()
export class CouplesService {
  private readonly logger = new Logger(CouplesService.name);

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(COUPLE_REPOSITORY)
    private readonly coupleRepository: ICoupleRepository,
    @Inject(COUPLE_MEMBER_REPOSITORY)
    private readonly coupleMemberRepository: ICoupleMemberRepository,
    @Inject(COUPLE_INVITE_REPOSITORY)
    private readonly coupleInviteRepository: ICoupleInviteRepository,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  // Envia um convite para formar/expandir um casal. Se o usuário ainda não
  // tiver um casal, cria um novo (com ele como OWNER). Garante que o casal
  // não exceda 2 membros e que o convidado não pertença a outro casal.
  async sendInvite(
    inviterUserId: string,
    inviteeEmail: string,
  ): Promise<InviteSummary> {
    const inviter = await this.usersRepository.findById(inviterUserId);
    if (!inviter) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    const normalizedInviteeEmail = inviteeEmail.toLowerCase();
    if (normalizedInviteeEmail === inviter.email.toLowerCase()) {
      throw new BadRequestException('Não é possível convidar você mesmo.');
    }

    const invitee = await this.usersRepository.findByEmail(
      normalizedInviteeEmail,
    );
    if (invitee) {
      const inviteeMembership = await this.coupleMemberRepository.findByUserId(
        invitee.id,
      );
      if (inviteeMembership) {
        throw new ConflictException('Este e-mail já pertence a outro casal.');
      }
    }

    const coupleId = await this.resolveCoupleIdForInviter(inviterUserId);

    const memberCount =
      await this.coupleMemberRepository.countByCoupleId(coupleId);
    if (memberCount >= MAX_COUPLE_MEMBERS) {
      throw new ConflictException(
        'Este casal já possui o número máximo de membros.',
      );
    }

    const token = this.tokenService.generateRawToken();
    const expiresAt = new Date(
      Date.now() + INVITE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    const invite = await this.coupleInviteRepository.create({
      coupleId,
      inviterUserId,
      inviteeEmail: normalizedInviteeEmail,
      token,
      expiresAt,
    });

    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
    const inviteUrl = `${frontendUrl}/couple-invites/${token}`;
    // O convite já foi persistido; falha no envio do e-mail não deve impedir
    // a resposta de sucesso (o convite continua válido e pode ser reenviado).
    try {
      await this.mailService.sendCoupleInvite(
        normalizedInviteeEmail,
        inviter.name,
        inviteUrl,
      );
    } catch (error) {
      this.logger.warn(
        `Falha ao enviar e-mail de convite para ${normalizedInviteeEmail}`,
        error instanceof Error ? error.stack : error,
      );
    }

    return {
      id: invite.id,
      inviteeEmail: invite.inviteeEmail,
      status: invite.status,
      expiresAt: invite.expiresAt,
    };
  }

  // Retorna o casal do usuário autenticado com os dados básicos dos membros.
  async getMyCouple(userId: string): Promise<CoupleSummary> {
    const membership = await this.coupleMemberRepository.findByUserId(userId);
    if (!membership) {
      throw new NotFoundException('Você ainda não pertence a um casal.');
    }

    const couple = await this.coupleRepository.findById(membership.coupleId);
    if (!couple) {
      throw new NotFoundException('Casal não encontrado.');
    }

    const members = await this.coupleMemberRepository.findByCoupleId(couple.id);
    const memberSummaries = await Promise.all(
      members.map(async (member): Promise<CoupleMemberSummary> => {
        const user = await this.usersRepository.findById(member.userId);
        return {
          userId: member.userId,
          name: user?.name ?? '',
          email: user?.email ?? '',
          role: member.role,
          joinedAt: member.joinedAt,
        };
      }),
    );

    return { id: couple.id, name: couple.name, members: memberSummaries };
  }

  // Lista os convites pendentes endereçados ao e-mail do usuário autenticado.
  async listMyInvites(userId: string): Promise<PendingInviteSummary[]> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const invites = await this.coupleInviteRepository.findPendingByInviteeEmail(
      user.email,
    );

    return Promise.all(
      invites.map(async (invite): Promise<PendingInviteSummary> => {
        const inviter = await this.usersRepository.findById(
          invite.inviterUserId,
        );
        return {
          id: invite.id,
          token: invite.token,
          inviterName: inviter?.name ?? '',
          expiresAt: invite.expiresAt,
        };
      }),
    );
  }

  // Aceita um convite: valida token/expiração/destinatário, garante que o
  // usuário ainda não pertence a outro casal e o adiciona como MEMBER.
  async acceptInvite(
    userId: string,
    token: string,
  ): Promise<{ coupleId: string }> {
    const invite = await this.loadValidInvite(userId, token);

    const existingMembership =
      await this.coupleMemberRepository.findByUserId(userId);
    if (existingMembership) {
      throw new ConflictException('Você já pertence a um casal.');
    }

    await this.coupleMemberRepository.create({
      coupleId: invite.coupleId,
      userId,
      role: CoupleMemberRole.MEMBER,
    });

    await this.coupleInviteRepository.updateStatus(
      invite.id,
      CoupleInviteStatus.ACCEPTED,
    );

    return { coupleId: invite.coupleId };
  }

  // Rejeita um convite: valida token/expiração/destinatário e marca o
  // convite como REJECTED.
  async rejectInvite(userId: string, token: string): Promise<void> {
    const invite = await this.loadValidInvite(userId, token);

    await this.coupleInviteRepository.updateStatus(
      invite.id,
      CoupleInviteStatus.REJECTED,
    );
  }

  // Carrega o convite pelo token e valida que está pendente, não expirou e
  // pertence ao e-mail do usuário autenticado.
  private async loadValidInvite(
    userId: string,
    token: string,
  ): Promise<CoupleInviteEntity> {
    const invite = await this.coupleInviteRepository.findByToken(token);
    if (!invite) {
      throw new NotFoundException('Convite não encontrado.');
    }

    if (invite.expiresAt < new Date()) {
      if (invite.status === CoupleInviteStatus.PENDING) {
        await this.coupleInviteRepository.updateStatus(
          invite.id,
          CoupleInviteStatus.EXPIRED,
        );
      }
      throw new BadRequestException('Convite expirado.');
    }

    if (invite.status !== CoupleInviteStatus.PENDING) {
      throw new BadRequestException('Convite já foi respondido.');
    }

    const user = await this.usersRepository.findById(userId);
    if (
      !user ||
      user.email.toLowerCase() !== invite.inviteeEmail.toLowerCase()
    ) {
      throw new ForbiddenException(
        'Este convite não pertence ao usuário autenticado.',
      );
    }

    return invite;
  }

  // Retorna o coupleId do usuário, criando um novo Couple + CoupleMember
  // (OWNER) caso ele ainda não pertença a nenhum.
  private async resolveCoupleIdForInviter(
    inviterUserId: string,
  ): Promise<string> {
    const existingMembership =
      await this.coupleMemberRepository.findByUserId(inviterUserId);
    if (existingMembership) {
      return existingMembership.coupleId;
    }

    const couple = await this.coupleRepository.create();
    await this.coupleMemberRepository.create({
      coupleId: couple.id,
      userId: inviterUserId,
      role: CoupleMemberRole.OWNER,
    });

    return couple.id;
  }
}
