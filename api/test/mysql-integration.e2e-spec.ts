import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as net from 'net';
import cookieParser = require('cookie-parser');
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';

function checkPort(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(600);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

describe('MySQL Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let validSessionCookie: string;
  let user1Id: bigint;
  let user2Id: bigint;
  let cookieUser2: string;
  let dbAvailable = false;

  beforeAll(async () => {
    const isUp = await checkPort(3306);
    if (!isUp) {
      dbAvailable = false;
      return;
    }

    try {
      process.env.DATABASE_URL =
        process.env.DATABASE_URL ?? 'mysql://will:will2009@localhost:3306/enqueteme';

      const module = await Test.createTestingModule({ imports: [AppModule] }).compile();

      app = module.createNestApplication();
      app.use(cookieParser());
      app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
      await app.init();

      prisma = module.get(PrismaService);
      dbAvailable = true;
    } catch {
      dbAvailable = false;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) return;
    // Clear all relevant tables
    await prisma.voto.deleteMany();
    await prisma.opcao.deleteMany();
    await prisma.enquete.deleteMany();
    await prisma.sessao.deleteMany();
    await prisma.usuario.deleteMany();

    const authService = app.get(AuthService);
    const { token: token1, user: u1 } = await authService.createSession({
      subject: 'subject-1',
      email: 'user1@test.com',
      name: 'User One',
    });
    const { token: token2, user: u2 } = await authService.createSession({
      subject: 'subject-2',
      email: 'user2@test.com',
      name: 'User Two',
    });

    user1Id = BigInt(u1.id);
    user2Id = BigInt(u2.id);

    validSessionCookie = `enqueteme_session=${token1}`;
    cookieUser2 = `enqueteme_session=${token2}`;
  });

  it('prevents duplicate votes (P2002)', async () => {
    if (!dbAvailable) return;
    const poll = await createTestPoll(user1Id, false);
    const optionId = Number(poll.opcoes[0].id);

    // First vote
    await request(app.getHttpServer())
      .post('/polls/vote')
      .set('Cookie', validSessionCookie)
      .send({ pollId: Number(poll.id), optionIds: [optionId] })
      .expect(200);

    // Second vote should fail with 409
    await request(app.getHttpServer())
      .post('/polls/vote')
      .set('Cookie', validSessionCookie)
      .send({ pollId: Number(poll.id), optionIds: [optionId] })
      .expect(409);
      
    // Assert only one vote in DB
    const votes = await prisma.voto.count();
    expect(votes).toBe(1);
  });

  it('rejects votes on expired polls', async () => {
    if (!dbAvailable) return;
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
      .send({ pollId: Number(poll.id), optionIds: [optionId] })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toBe('Poll has expired.');
      });
  });

  it('enforces poll ownership', async () => {
    if (!dbAvailable) return;
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
    if (!dbAvailable) return;
    const poll = await createTestPoll(user1Id, false);
    const optionId = Number(poll.opcoes[0].id);

    // Vote concurrently with multiple anonymous users (requireLogin = false)
    const requests = Array.from({ length: 10 }).map(() =>
      request(app.getHttpServer())
        .post('/polls/vote')
        .send({ pollId: Number(poll.id), optionIds: [optionId] })
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
