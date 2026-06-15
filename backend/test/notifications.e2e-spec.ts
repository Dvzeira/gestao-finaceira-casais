import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { MailService } from '../src/infra/mail/mail.service';
import { PrismaService } from '../src/infra/prisma/prisma.service';

describe('Notifications (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const mailService = {
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    sendCoupleInvite: jest.fn().mockResolvedValue(undefined),
  };

  const password = 'senha-inicial-123';
  const ownerEmail = `notifications-owner-${Date.now()}@example.com`;
  const memberEmail = `notifications-member-${Date.now()}@example.com`;

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
      where: { email: { in: [ownerEmail, memberEmail] } },
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

  it('lista, marca como lida e marca todas as notificações ao atingir uma meta', async () => {
    const ownerToken = await registerAndLogin('Owner', ownerEmail);
    const memberToken = await registerAndLogin('Member', memberEmail);

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

    // Cria uma meta e a completa em uma única contribuição -> dispara GOAL_ACHIEVED
    const createResponse = await request(app.getHttpServer())
      .post('/goals')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Reserva de emergência',
        targetAmount: 100,
        targetDate: '2027-06-01',
        splits: [
          { userId: ownerUserId, percentage: 50 },
          { userId: memberUserId, percentage: 50 },
        ],
      })
      .expect(201);
    const goal = createResponse.body as { id: string };

    await request(app.getHttpServer())
      .post(`/goals/${goal.id}/contributions`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 100, contributedAt: '2026-06-10' })
      .expect(201);

    // Ambos os membros do casal recebem a notificação de meta alcançada
    const ownerNotifications = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const ownerNotificationList = ownerNotifications.body as {
      id: string;
      type: string;
      relatedEntityId: string | null;
      readAt: string | null;
    }[];
    const ownerGoalNotification = ownerNotificationList.find(
      (notification) =>
        notification.type === 'GOAL_ACHIEVED' &&
        notification.relatedEntityId === goal.id,
    );
    expect(ownerGoalNotification).toBeDefined();
    expect(ownerGoalNotification?.readAt).toBeNull();

    const memberNotifications = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    const memberGoalNotification = (
      memberNotifications.body as {
        type: string;
        relatedEntityId: string | null;
      }[]
    ).find(
      (notification) =>
        notification.type === 'GOAL_ACHIEVED' &&
        notification.relatedEntityId === goal.id,
    );
    expect(memberGoalNotification).toBeDefined();

    // Contagem de não lidas reflete a nova notificação
    const unreadCountResponse = await request(app.getHttpServer())
      .get('/notifications/unread-count')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(
      (unreadCountResponse.body as { count: number }).count,
    ).toBeGreaterThanOrEqual(1);

    // Marca a notificação do owner como lida
    const notificationId = ownerGoalNotification?.id as string;
    const markAsReadResponse = await request(app.getHttpServer())
      .patch(`/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(
      (markAsReadResponse.body as { readAt: string | null }).readAt,
    ).not.toBeNull();

    // Filtra apenas não lidas: a notificação recém-lida não aparece mais
    const ownerUnreadOnly = await request(app.getHttpServer())
      .get('/notifications?onlyUnread=true')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(
      (ownerUnreadOnly.body as { id: string }[]).map(
        (notification) => notification.id,
      ),
    ).not.toContain(notificationId);

    // Um usuário não pode marcar como lida a notificação de outro
    await request(app.getHttpServer())
      .patch(`/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(404);

    // Marca todas as notificações do member como lidas
    await request(app.getHttpServer())
      .patch('/notifications/read-all')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(204);

    const memberUnreadCount = await request(app.getHttpServer())
      .get('/notifications/unread-count')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    expect((memberUnreadCount.body as { count: number }).count).toBe(0);
  });
});
