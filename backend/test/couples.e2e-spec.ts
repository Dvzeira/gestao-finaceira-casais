import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { MailService } from '../src/infra/mail/mail.service';
import { PrismaService } from '../src/infra/prisma/prisma.service';

describe('Couples (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const mailService = {
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    sendCoupleInvite: jest.fn().mockResolvedValue(undefined),
  };

  const password = 'senha-inicial-123';
  const emails: [string, string, string, string] = [
    `casal-a-${Date.now()}@example.com`,
    `casal-b-${Date.now()}@example.com`,
    `casal-c-${Date.now()}@example.com`,
    `casal-d-${Date.now()}@example.com`,
  ];

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
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await app.close();
  });

  function extractInviteToken(inviteUrl: string): string {
    const url = new URL(inviteUrl);
    const segments = url.pathname.split('/');
    const token = segments[segments.length - 1];
    if (!token) {
      throw new Error('Token de convite não encontrado na URL');
    }
    return token;
  }

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

  it('fluxo completo: convite -> aceite -> consulta do casal', async () => {
    const tokenA = await registerAndLogin('Alice', emails[0]);
    const tokenB = await registerAndLogin('Bob', emails[1]);

    // 1. Alice convida Bob
    await request(app.getHttpServer())
      .post('/couples/invite')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ inviteeEmail: emails[1] })
      .expect(201);

    expect(mailService.sendCoupleInvite).toHaveBeenCalledTimes(1);
    const [inviteeEmail, inviterName, inviteUrl] = mailService.sendCoupleInvite
      .mock.calls[0] as [string, string, string];
    expect(inviteeEmail).toBe(emails[1]);
    expect(inviterName).toBe('Alice');

    // 2. Bob lista os convites pendentes
    const invitesResponse = await request(app.getHttpServer())
      .get('/couples/invites')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const invites = invitesResponse.body as { inviterName: string }[];
    expect(invites).toHaveLength(1);
    expect(invites[0]?.inviterName).toBe('Alice');

    // 3. Bob aceita o convite
    const inviteToken = extractInviteToken(inviteUrl);
    const acceptResponse = await request(app.getHttpServer())
      .post(`/couples/invites/${inviteToken}/accept`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const { coupleId } = acceptResponse.body as { coupleId: string };
    expect(typeof coupleId).toBe('string');

    // 4. Ambos consultam o casal e veem os dois membros
    const coupleFromA = await request(app.getHttpServer())
      .get('/couples/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const coupleBodyA = coupleFromA.body as {
      id: string;
      members: { email: string }[];
    };
    expect(coupleBodyA.id).toBe(coupleId);
    expect(coupleBodyA.members.map((member) => member.email).sort()).toEqual(
      [emails[0], emails[1]].sort(),
    );

    const coupleFromB = await request(app.getHttpServer())
      .get('/couples/me')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const coupleBodyB = coupleFromB.body as { id: string };
    expect(coupleBodyB.id).toBe(coupleId);
  });

  it('fluxo de rejeição: convite rejeitado não mantém o casal pendente', async () => {
    const tokenC = await registerAndLogin('Carol', emails[2]);
    const tokenD = await registerAndLogin('Dan', emails[3]);

    await request(app.getHttpServer())
      .post('/couples/invite')
      .set('Authorization', `Bearer ${tokenC}`)
      .send({ inviteeEmail: emails[3] })
      .expect(201);

    const [, , inviteUrl] = mailService.sendCoupleInvite.mock.calls[
      mailService.sendCoupleInvite.mock.calls.length - 1
    ] as [string, string, string];
    const inviteToken = extractInviteToken(inviteUrl);

    // Dan rejeita o convite
    await request(app.getHttpServer())
      .post(`/couples/invites/${inviteToken}/reject`)
      .set('Authorization', `Bearer ${tokenD}`)
      .expect(200);

    // Dan não tem mais convites pendentes
    const invitesResponse = await request(app.getHttpServer())
      .get('/couples/invites')
      .set('Authorization', `Bearer ${tokenD}`)
      .expect(200);
    expect(invitesResponse.body as unknown[]).toHaveLength(0);

    // Dan ainda não pertence a um casal
    await request(app.getHttpServer())
      .get('/couples/me')
      .set('Authorization', `Bearer ${tokenD}`)
      .expect(404);
  });
});
