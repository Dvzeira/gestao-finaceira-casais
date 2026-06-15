import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { MailService } from '../src/infra/mail/mail.service';
import { PrismaService } from '../src/infra/prisma/prisma.service';

describe('Goals (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const mailService = {
    sendEmailConfirmation: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    sendCoupleInvite: jest.fn().mockResolvedValue(undefined),
  };

  const password = 'senha-inicial-123';
  const ownerEmail = `goals-owner-${Date.now()}@example.com`;
  const memberEmail = `goals-member-${Date.now()}@example.com`;
  const outsiderEmail = `goals-outsider-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mailService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, memberEmail, outsiderEmail] } },
    });
    await app.close();
  });

  function extractConfirmationToken(confirmationUrl: string): string {
    const url = new URL(confirmationUrl);
    const token = url.searchParams.get('token');
    if (!token) {
      throw new Error('Token de confirmação não encontrado na URL');
    }
    return token;
  }

  async function registerAndLogin(
    name: string,
    email: string,
  ): Promise<string> {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name, email, password })
      .expect(201);

    const [, confirmationUrl] = mailService.sendEmailConfirmation.mock.calls[
      mailService.sendEmailConfirmation.mock.calls.length - 1
    ] as [string, string];
    await request(app.getHttpServer())
      .post('/auth/confirm-email')
      .send({ token: extractConfirmationToken(confirmationUrl) })
      .expect(200);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const { accessToken } = loginResponse.body as { accessToken: string };
    return accessToken;
  }

  it('CRUD completo de metas financeiras, splits e contribuições, restrito ao casal', async () => {
    const ownerToken = await registerAndLogin('Owner', ownerEmail);
    const memberToken = await registerAndLogin('Member', memberEmail);
    const outsiderToken = await registerAndLogin('Outsider', outsiderEmail);

    // Sem pertencer a um casal, o acesso é proibido
    await request(app.getHttpServer())
      .get('/goals')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);

    // Forma o casal owner + member via convite/aceite
    await request(app.getHttpServer())
      .post('/couples/invite')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ inviteeEmail: memberEmail })
      .expect(201);

    const [, , inviteUrl] = mailService.sendCoupleInvite.mock.calls[
      mailService.sendCoupleInvite.mock.calls.length - 1
    ] as [string, string, string];
    const inviteToken = new URL(inviteUrl).pathname.split('/').pop() as string;

    await request(app.getHttpServer())
      .post(`/couples/invites/${inviteToken}/accept`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    const meResponse = await request(app.getHttpServer())
      .get('/couples/me')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const members = (meResponse.body as { members: { userId: string }[] })
      .members;
    const [ownerUserId, memberUserId] = members.map((member) => member.userId);

    // 1. Criar meta com splits inválidos (soma != 100) -> erro
    await request(app.getHttpServer())
      .post('/goals')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Viagem inválida',
        targetAmount: 10000,
        targetDate: '2027-06-01',
        splits: [
          { userId: ownerUserId, percentage: 40 },
          { userId: memberUserId, percentage: 50 },
        ],
      })
      .expect(400);

    // 2. Criar meta com splits válidos
    const createResponse = await request(app.getHttpServer())
      .post('/goals')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Viagem',
        targetAmount: 10000,
        targetDate: '2027-06-01',
        splits: [
          { userId: ownerUserId, percentage: 60 },
          { userId: memberUserId, percentage: 40 },
        ],
      })
      .expect(201);
    const created = createResponse.body as {
      id: string;
      totalContributed: number;
      remainingAmount: number;
      progressPercentage: number;
      status: string;
    };
    expect(created.totalContributed).toBe(0);
    expect(created.remainingAmount).toBe(10000);
    expect(created.progressPercentage).toBe(0);
    expect(created.status).toBe('IN_PROGRESS');

    // 3. Listar metas (o outro membro do casal também vê)
    const listResponse = await request(app.getHttpServer())
      .get('/goals')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    expect(
      (listResponse.body as { id: string }[]).map((goal) => goal.id),
    ).toContain(created.id);

    // 4. Buscar por id
    await request(app.getHttpServer())
      .get(`/goals/${created.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    // 5. Atualizar título
    const updateResponse = await request(app.getHttpServer())
      .patch(`/goals/${created.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Viagem para a praia' })
      .expect(200);
    expect((updateResponse.body as { title: string }).title).toBe(
      'Viagem para a praia',
    );

    // 6. Registrar contribuição parcial
    const contributionResponse = await request(app.getHttpServer())
      .post(`/goals/${created.id}/contributions`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ amount: 4000, contributedAt: '2026-06-10' })
      .expect(201);
    const contribution = contributionResponse.body as {
      id: string;
      amount: number;
    };
    expect(contribution.amount).toBe(4000);

    // 7. A meta reflete o progresso após a contribuição
    const goalAfterContribution = await request(app.getHttpServer())
      .get(`/goals/${created.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const goalProgress = goalAfterContribution.body as {
      totalContributed: number;
      remainingAmount: number;
      progressPercentage: number;
      status: string;
    };
    expect(goalProgress.totalContributed).toBe(4000);
    expect(goalProgress.remainingAmount).toBe(6000);
    expect(goalProgress.progressPercentage).toBe(40);
    expect(goalProgress.status).toBe('IN_PROGRESS');

    // 8. Registrar contribuição que completa a meta -> marca como ACHIEVED
    await request(app.getHttpServer())
      .post(`/goals/${created.id}/contributions`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 6000, contributedAt: '2026-06-15' })
      .expect(201);

    const goalAchieved = await request(app.getHttpServer())
      .get(`/goals/${created.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect((goalAchieved.body as { status: string }).status).toBe('ACHIEVED');

    // 9. Listar contribuições
    const contributionsList = await request(app.getHttpServer())
      .get(`/goals/${created.id}/contributions`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    expect(contributionsList.body as { id: string }[]).toHaveLength(2);

    // 10. Remover a primeira contribuição volta o status para IN_PROGRESS
    await request(app.getHttpServer())
      .delete(`/goals/${created.id}/contributions/${contribution.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    const goalAfterRemoval = await request(app.getHttpServer())
      .get(`/goals/${created.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect((goalAfterRemoval.body as { status: string }).status).toBe(
      'IN_PROGRESS',
    );

    // 11. Remover a meta
    await request(app.getHttpServer())
      .delete(`/goals/${created.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/goals/${created.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });
});
