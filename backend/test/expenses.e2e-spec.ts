import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { MailService } from '../src/infra/mail/mail.service';
import { PrismaService } from '../src/infra/prisma/prisma.service';

describe('Expenses (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const mailService = {
    sendEmailConfirmation: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    sendCoupleInvite: jest.fn().mockResolvedValue(undefined),
  };

  const password = 'senha-inicial-123';
  const ownerEmail = `expenses-owner-${Date.now()}@example.com`;
  const memberEmail = `expenses-member-${Date.now()}@example.com`;
  const outsiderEmail = `expenses-outsider-${Date.now()}@example.com`;

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
    const users = await prisma.user.findMany({
      where: { email: { in: [ownerEmail, memberEmail, outsiderEmail] } },
      select: { id: true },
    });
    const userIds = users.map((user) => user.id);
    await prisma.expense.deleteMany({
      where: { createdByUserId: { in: userIds } },
    });
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

  it('CRUD completo de despesas, incluindo parcelamento e regras de rateio, restrito ao casal', async () => {
    const ownerToken = await registerAndLogin('Owner', ownerEmail);
    const memberToken = await registerAndLogin('Member', memberEmail);
    const outsiderToken = await registerAndLogin('Outsider', outsiderEmail);

    // Sem pertencer a um casal, o acesso é proibido
    await request(app.getHttpServer())
      .get('/expenses')
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

    // Obtém o id de uma categoria global (seed) e o id do membro do casal
    const categoriesResponse = await request(app.getHttpServer())
      .get('/expense-categories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const categoryId = (categoriesResponse.body as { id: string }[])[0]
      ?.id as string;

    const meResponse = await request(app.getHttpServer())
      .get('/couples/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    const memberUserId = (meResponse.body as { members: { userId: string }[] })
      .members[0]?.userId;

    // 1. Criar despesa SHARED com percentuais válidos
    const createResponse = await request(app.getHttpServer())
      .post('/expenses')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        description: 'Aluguel',
        amount: 1500,
        categoryId,
        ownership: 'SHARED',
        sharedSplitPercentageA: 50,
        sharedSplitPercentageB: 50,
        dueDate: '2026-06-10',
      })
      .expect(201);
    const createdShared = (
      createResponse.body as { id: string; amount: number }[]
    )[0];
    expect(createdShared).toBeDefined();
    expect(createdShared?.amount).toBe(1500);

    // 2. Criar despesa SHARED com percentuais inválidos -> erro
    await request(app.getHttpServer())
      .post('/expenses')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        description: 'Inválida',
        amount: 100,
        categoryId,
        ownership: 'SHARED',
        sharedSplitPercentageA: 40,
        sharedSplitPercentageB: 50,
        dueDate: '2026-06-10',
      })
      .expect(400);

    // 3. Criar despesa parcelada (3x)
    const installmentResponse = await request(app.getHttpServer())
      .post('/expenses')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        description: 'Geladeira',
        amount: 300,
        categoryId,
        ownership: 'SHARED',
        sharedSplitPercentageA: 50,
        sharedSplitPercentageB: 50,
        dueDate: '2026-07-10',
        installmentTotal: 3,
      })
      .expect(201);
    const installments = installmentResponse.body as {
      id: string;
      installmentNumber: number;
      installmentTotal: number;
      dueDate: string;
    }[];
    expect(installments).toHaveLength(3);
    expect(installments.map((item) => item.installmentNumber)).toEqual([
      1, 2, 3,
    ]);
    expect(installments.every((item) => item.installmentTotal === 3)).toBe(
      true,
    );

    // 4. Listar despesas filtrando por mês de referência (o outro membro também vê)
    const julyListResponse = await request(app.getHttpServer())
      .get('/expenses')
      .query({ referenceMonth: '2026-07-01' })
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    const julyList = julyListResponse.body as { id: string }[];
    expect(julyList.map((expense) => expense.id)).toContain(
      installments[0]?.id,
    );
    expect(julyList.map((expense) => expense.id)).not.toContain(
      createdShared?.id,
    );

    // 5. Buscar por id
    await request(app.getHttpServer())
      .get(`/expenses/${createdShared?.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    // 6. Atualizar status para PAID define paidAt automaticamente
    const updateResponse = await request(app.getHttpServer())
      .patch(`/expenses/${createdShared?.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'PAID' })
      .expect(200);
    const updated = updateResponse.body as {
      status: string;
      paidAt: string | null;
    };
    expect(updated.status).toBe('PAID');
    expect(updated.paidAt).not.toBeNull();

    // 7. Atualizar para INDIVIDUAL exige um responsável pertencente ao casal
    if (memberUserId) {
      const individualUpdate = await request(app.getHttpServer())
        .patch(`/expenses/${createdShared?.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ ownership: 'INDIVIDUAL', ownerUserId: memberUserId })
        .expect(200);
      expect((individualUpdate.body as { ownership: string }).ownership).toBe(
        'INDIVIDUAL',
      );
    }

    // 8. Remover despesa
    await request(app.getHttpServer())
      .delete(`/expenses/${createdShared?.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/expenses/${createdShared?.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });
});
