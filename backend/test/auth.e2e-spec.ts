import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { MailService } from '../src/infra/mail/mail.service';
import { PrismaService } from '../src/infra/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const mailService = {
    sendEmailConfirmation: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  };

  const email = `casal-${Date.now()}@example.com`;
  const password = 'senha-inicial-123';
  const newPassword = 'senha-nova-456';

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
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  function extractToken(confirmationUrl: string): string {
    const url = new URL(confirmationUrl);
    const token = url.searchParams.get('token');
    if (!token) {
      throw new Error('Token não encontrado na URL');
    }
    return token;
  }

  it('fluxo completo: registro -> confirmação -> login -> rota protegida -> refresh -> forgot/reset', async () => {
    // 1. Registro
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Casal Teste', email, password })
      .expect(201);

    const registerBody = registerResponse.body as {
      id: string;
      name: string;
      email: string;
    };
    expect(typeof registerBody.id).toBe('string');
    expect(registerBody.name).toBe('Casal Teste');
    expect(registerBody.email).toBe(email);
    expect(mailService.sendEmailConfirmation).toHaveBeenCalledTimes(1);

    // 2. Confirmação de e-mail
    const [, confirmationUrl] = mailService.sendEmailConfirmation.mock
      .calls[0] as [string, string];
    await request(app.getHttpServer())
      .post('/auth/confirm-email')
      .send({ token: extractToken(confirmationUrl) })
      .expect(200);

    // 3. Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const { accessToken, refreshToken } = loginResponse.body as {
      accessToken: string;
      refreshToken: string;
    };
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();

    // 4. Rota protegida com access token
    await request(app.getHttpServer())
      .get('/')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect('Hello World!');

    // 4b. Rota protegida sem token
    await request(app.getHttpServer()).get('/').expect(401);

    // 5. Refresh
    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    const newTokens = refreshResponse.body as {
      accessToken: string;
      refreshToken: string;
    };
    expect(newTokens.accessToken).toBeDefined();
    expect(newTokens.refreshToken).toBeDefined();

    // 6. Forgot password
    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email })
      .expect(200);

    expect(mailService.sendPasswordReset).toHaveBeenCalledTimes(1);

    // 7. Reset password
    const [, resetUrl] = mailService.sendPasswordReset.mock.calls[0] as [
      string,
      string,
    ];
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: extractToken(resetUrl), newPassword })
      .expect(200);

    // 8. Login com a senha antiga deve falhar
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(401);

    // 9. Login com a nova senha deve funcionar
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: newPassword })
      .expect(200);
  });
});
