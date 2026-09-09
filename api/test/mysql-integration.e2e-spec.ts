import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser = require('cookie-parser');
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('MySQL Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let validSessionCookie: string;
  let user1Id: bigint;
  let user2Id: bigint;
  let cookieUser2: string;

  beforeAll(async () => {
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ?? 'mysql://will:will2009@localhost:3306/enqueteme';

    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    prisma = module.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear all relevant tables
    await prisma.voto.deleteMany();
    await prisma.opcao.deleteMany();
    await prisma.enquete.deleteMany();
    await prisma.sessao.deleteMany();
    await prisma.usuario.deleteMany();

    const user1 = await prisma.usuario.create({
      data: {
        googleSubject: 'subject-1',
        email: 'user1@test.com',
        name: 'User One',
      },
    });
    user1Id = user1.id;

    const user2 = await prisma.usuario.create({
      data: {
        googleSubject: 'subject-2',
        email: 'user2@test.com',
        name: 'User Two',
      },
    });
    user2Id = user2.id;

    const authService = app.get('AuthService');
    const { cookieValue: cookie1 } = await authService.createSession(user1.id);
    const { cookieValue: cookie2 } = await authService.createSession(user2.id);

    validSessionCookie = `enqueteme_session=${cookie1}`;
    cookieUser2 = `enqueteme_session=${cookie2}`;
  });

  it('prevents duplicate votes (P2002)', async () => {
    const poll = await createTestPoll(user1Id, false);
    const optionId = Number(poll.opcoes[0].id);

    // First vote
    await request(app.getHttpServer())
      .post('/polls/vote')
      .set('Cookie', validSessionCookie)
      .send({ pollId: Number(poll.id), optionId })
      .expect(200);

    // Second vote should fail with 409
    await request(app.getHttpServer())
      .post('/polls/vote')
      .set('Cookie', validSessionCookie)
      .send({ pollId: Number(poll.id), optionId })
      .expect(409);
      
    // Assert only one vote in DB
    const votes = await prisma.voto.count();
    expect(votes).toBe(1);
  });

  it('rejects votes on expired polls', async () => {
    const poll = await createTestPoll(user1Id, false);
    
    // Set to expired
    await prisma.enquete.update({
      where: { id: poll.id },
      data: { expirationDate: new Date('2000-01-01T00:00:00Z') }
    });

    const optionId = Number(poll.opcoes[0].id);
    
    await request(app.getHttpServer())
      .post('/polls/vote')
      .set('Cookie', validSessionCookie)
      .send({ pollId: Number(poll.id), optionId })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toBe('Poll has expired.');
      });
  });

  it('enforces poll ownership', async () => {
    const poll = await createTestPoll(user1Id, false);

    // user2 tries to close user1's poll
    await request(app.getHttpServer())
      .patch(`/polls/${poll.id}/close`)
      .set('Cookie', cookieUser2)
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toBe('You do not own this poll.');
      });
  });

  it('handles concurrent voting correctly', async () => {
    const poll = await createTestPoll(user1Id, false);
    const optionId = Number(poll.opcoes[0].id);

    // Vote concurrently with multiple anonymous users (requireLogin = false)
    const requests = Array.from({ length: 10 }).map(() =>
      request(app.getHttpServer())
        .post('/polls/vote')
        .send({ pollId: Number(poll.id), optionId })
    );

    const responses = await Promise.all(requests);
    const successCount = responses.filter(r => r.status === 200).length;

    expect(successCount).toBe(10);
    
    const option = await prisma.opcao.findUnique({ where: { id: BigInt(optionId) } });
    expect(Number(option?.votes)).toBe(10);
  });

  async function createTestPoll(userId: bigint, requireLogin: boolean) {
    const now = new Date();
    const expirationDate = new Date(now);
    expirationDate.setDate(expirationDate.getDate() + 7);

    return prisma.enquete.create({
      data: {
        title: 'Test Poll',
        createdAt: now,
        updatedAt: now,
        voteRequireLogin: requireLogin,
        expirationDate,
        usuario: { connect: { id: userId } },
        opcoes: {
          create: [
            { name: 'Option 1', votes: 0n },
            { name: 'Option 2', votes: 0n },
          ],
        },
      },
      include: { opcoes: true },
    });
  }
});
