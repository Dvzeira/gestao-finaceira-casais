import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { MailService } from '../src/infra/mail/mail.service';
import { PrismaService } from '../src/infra/prisma/prisma.service';

describe('Incomes (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const mailService = {
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    sendCoupleInvite: jest.fn().mockResolvedValue(undefined),
  };

  const password = 'senha-inicial-123';
  const ownerEmail = `incomes-owner-${Date.now()}@example.com`;
  const outsiderEmail = `incomes-outsider-${Date.now()}@example.com`;

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
      where: { email: { in: [ownerEmail, outsiderEmail] } },
    });
    await app.close();
  });

  async function registerAndLogin(
    name: string,
    email: string,
  ): Promise<string> {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name, email, password })
      .expect(200);

    const { accessToken } = registerResponse.body as { accessToken: string };
    return accessToken;
  }

  it('CRUD completo de receitas, restrito ao casal do usuário autenticado', async () => {
    const ownerToken = await registerAndLogin('Owner', ownerEmail);
    const outsiderToken = await registerAndLogin('Outsider', outsiderEmail);

    // Sem pertencer a um casal, o acesso é proibido
    await request(app.getHttpServer())
      .get('/incomes')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);

    // Owner forma um casal convidando a si mesmo via fluxo normal não é possível;
    // como o CoupleMemberGuard exige casal, criamos o casal convidando outsider
    // e aceitando, garantindo que owner tenha um coupleId válido.
    await request(app.getHttpServer())
      .post('/couples/invite')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ inviteeEmail: outsiderEmail })
      .expect(201);

    const [, , inviteUrl] = mailService.sendCoupleInvite.mock.calls[
      mailService.sendCoupleInvite.mock.calls.length - 1
    ] as [string, string, string];
    const inviteToken = new URL(inviteUrl).pathname.split('/').pop() as string;

    await request(app.getHttpServer())
      .post(`/couples/invites/${inviteToken}/accept`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(200);

    // 1. Criar receita
    const createResponse = await request(app.getHttpServer())
      .post('/incomes')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        type: 'SALARY',
        description: 'Salário de junho',
        amount: 5000,
        referenceMonth: '2026-06-01',
        receivedAt: '2026-06-05',
      })
      .expect(201);

    const created = createResponse.body as { id: string; amount: number };
    expect(typeof created.id).toBe('string');
    expect(created.amount).toBe(5000);

    // 2. Listar receitas (o outro membro do casal também vê)
    const listResponse = await request(app.getHttpServer())
      .get('/incomes')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(200);
    const list = listResponse.body as { id: string }[];
    expect(list.map((income) => income.id)).toContain(created.id);

    // 3. Buscar por id
    await request(app.getHttpServer())
      .get(`/incomes/${created.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    // 4. Atualizar
    const updateResponse = await request(app.getHttpServer())
      .patch(`/incomes/${created.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 5500 })
      .expect(200);
    expect((updateResponse.body as { amount: number }).amount).toBe(5500);

    // 5. Remover
    await request(app.getHttpServer())
      .delete(`/incomes/${created.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/incomes/${created.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });
});
