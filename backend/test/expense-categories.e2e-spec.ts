import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { MailService } from '../src/infra/mail/mail.service';
import { PrismaService } from '../src/infra/prisma/prisma.service';

describe('ExpenseCategories (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const mailService = {
    sendEmailConfirmation: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    sendCoupleInvite: jest.fn().mockResolvedValue(undefined),
  };

  const password = 'senha-inicial-123';
  const ownerEmail = `expense-categories-owner-${Date.now()}@example.com`;
  const memberEmail = `expense-categories-member-${Date.now()}@example.com`;
  const outsiderEmail = `expense-categories-outsider-${Date.now()}@example.com`;

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

  it('lista, cria e remove categorias de despesa, restrito ao casal do usuário autenticado', async () => {
    const ownerToken = await registerAndLogin('Owner', ownerEmail);
    const memberToken = await registerAndLogin('Member', memberEmail);
    const outsiderToken = await registerAndLogin('Outsider', outsiderEmail);

    // Sem pertencer a um casal, o acesso é proibido
    await request(app.getHttpServer())
      .get('/expense-categories')
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

    // 1. Listar categorias retorna as globais (seed)
    const listResponse = await request(app.getHttpServer())
      .get('/expense-categories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const initialList = listResponse.body as {
      id: string;
      name: string;
      coupleId: string | null;
    }[];
    expect(initialList.length).toBeGreaterThan(0);
    expect(initialList.some((category) => category.coupleId === null)).toBe(
      true,
    );

    // 2. Criar categoria personalizada
    const customName = `Categoria Teste ${Date.now()}`;
    const createResponse = await request(app.getHttpServer())
      .post('/expense-categories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: customName, icon: 'star', color: '#10b981' })
      .expect(201);
    const created = createResponse.body as { id: string; name: string };
    expect(created.name).toBe(customName);

    // 3. A categoria personalizada aparece para o outro membro do casal
    const listAfterCreate = await request(app.getHttpServer())
      .get('/expense-categories')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    expect(
      (listAfterCreate.body as { id: string }[]).map((category) => category.id),
    ).toContain(created.id);

    // 4. Criar categoria com nome já existente (global) -> conflito
    const existingGlobalCategory = initialList.find(
      (category) => category.id !== created.id,
    );
    if (existingGlobalCategory) {
      await request(app.getHttpServer())
        .post('/expense-categories')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: existingGlobalCategory.name })
        .expect(409);
    }

    // 5. Não é possível remover uma categoria global
    if (existingGlobalCategory) {
      await request(app.getHttpServer())
        .delete(`/expense-categories/${existingGlobalCategory.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(403);
    }

    // 6. Remover a categoria personalizada
    await request(app.getHttpServer())
      .delete(`/expense-categories/${created.id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(204);

    const listAfterDelete = await request(app.getHttpServer())
      .get('/expense-categories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(
      (listAfterDelete.body as { id: string }[]).map((category) => category.id),
    ).not.toContain(created.id);
  });
});
