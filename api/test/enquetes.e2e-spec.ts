import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser = require('cookie-parser');
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Enquetes API', () => {
  let app: INestApplication;
  const prisma = {
    $transaction: jest.fn(),
    sessao: {
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    enquete: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
    },
    opcao: {
      updateMany: jest.fn(),
    },
  };
  const usuario = {
    id: 1n,
    googleSubject: 'google-123',
    email: 'will@example.com',
    name: 'Will',
  };
  const enquete = {
    id: 10n,
    title: 'Melhor framework?',
    createdAt: new Date('2026-08-11T12:00:00.000Z'),
    updatedAt: new Date('2026-08-11T12:00:00.000Z'),
    voteRequireLogin: false,
    expirationDate: new Date('2026-08-18T12:00:00.000Z'),
    usuarioId: 1n,
    usuario,
    opcoes: [
      { id: 20n, name: 'NestJS', votes: 0n, enqueteId: 10n },
      { id: 21n, name: 'Spring', votes: 1n, enqueteId: 10n },
    ],
  };

  beforeAll(async () => {
    prisma.$transaction.mockImplementation(
      (operation: (transaction: typeof prisma) => unknown) =>
        operation(prisma),
    );
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.sessao.findUnique.mockResolvedValue({
      tokenHash: 'stored-hash',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      usuarioId: usuario.id,
      usuario,
    });
  });
  afterAll(() => app.close());

  it('returns no content when there are no polls', async () => {
    prisma.enquete.findMany.mockResolvedValue([]);

    await request(app.getHttpServer()).get('/polls').expect(204);
  });

  it('returns polls using the Angular response shape', async () => {
    prisma.enquete.findMany.mockResolvedValue([enquete]);

    await request(app.getHttpServer())
      .get('/polls')
      .expect(200)
      .expect([
        {
          id: 10,
          title: 'Melhor framework?',
          creatorName: 'Will',
          expirationDate: '2026-08-18T12:00:00.000Z',
          voteRequireLogin: false,
          options: [
            { id: 20, name: 'NestJS', votes: 0 },
            { id: 21, name: 'Spring', votes: 1 },
          ],
        },
      ]);
  });

  it('rejects incomplete poll data', async () => {
    await request(app.getHttpServer())
      .post('/polls')
      .send({ title: 'Only one option', options: ['NestJS'], userId: 1 })
      .set('Cookie', 'enqueteme_session=valid-token')
      .expect(400);
  });

  it('rejects blank options and non-positive duration', async () => {
    await request(app.getHttpServer())
      .post('/polls')
      .send({
        title: 'Question',
        options: ['A', '   '],
        pollExpirationInDays: 0,
        userId: 1,
      })
      .set('Cookie', 'enqueteme_session=valid-token')
      .expect(400);
  });

  it('rejects identifiers outside JavaScript safe integer range', async () => {
    await request(app.getHttpServer())
      .post('/polls/vote')
      .send({ pollId: Number.MAX_SAFE_INTEGER + 1, optionId: 20 })
      .expect(400);
  });

  it('rejects poll creation without a session', async () => {
    await request(app.getHttpServer())
      .post('/polls')
      .send({ title: 'Question', options: ['A', 'B'] })
      .expect(401);
  });

  it('creates a poll for the session user with a seven-day expiration', async () => {
    prisma.enquete.create.mockResolvedValue(enquete);

    await request(app.getHttpServer())
      .post('/polls')
      .send({
        title: 'Melhor framework?',
        options: ['NestJS', 'Spring'],
        userId: 999,
      })
      .set('Cookie', 'enqueteme_session=valid-token')
      .expect(201)
      .expect((response) => {
        expect(response.body.id).toBe(10);
        expect(response.body.options).toHaveLength(2);
      });

    const data = prisma.enquete.create.mock.calls[0][0].data;
    expect(data.expirationDate.getTime() - data.createdAt.getTime()).toBe(
      7 * 24 * 60 * 60 * 1000,
    );
    expect(data.usuario).toEqual({ connect: { id: 1n } });
  });

  it('rejects a vote for an unknown poll', async () => {
    prisma.enquete.findUnique.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post('/polls/vote')
      .send({ pollId: 999, optionId: 20 })
      .expect(400);
  });

  it('rejects a vote without an option', async () => {
    prisma.enquete.findUnique.mockResolvedValue({
      ...enquete,
      opcoes: [...enquete.opcoes],
    });

    await request(app.getHttpServer())
      .post('/polls/vote')
      .send({ pollId: 10 })
      .expect(400);
  });

  it('rejects an option that does not belong to the poll', async () => {
    prisma.enquete.findUnique.mockResolvedValue({
      ...enquete,
      opcoes: [...enquete.opcoes],
    });
    prisma.opcao.updateMany.mockResolvedValue({ count: 0 });

    await request(app.getHttpServer())
      .post('/polls/vote')
      .send({ pollId: 10, optionId: 999 })
      .expect(400);
  });

  it('increments the selected option atomically', async () => {
    prisma.enquete.findUnique.mockResolvedValue({
      ...enquete,
      opcoes: [...enquete.opcoes],
    });
    prisma.opcao.updateMany.mockResolvedValue({ count: 1 });
    prisma.enquete.findUniqueOrThrow.mockResolvedValue({
      ...enquete,
      opcoes: [
        { ...enquete.opcoes[0], votes: 1n },
        enquete.opcoes[1],
      ],
    });

    await request(app.getHttpServer())
      .post('/polls/vote')
      .send({ pollId: 10, optionId: 20 })
      .expect(200)
      .expect((response) => {
        expect(response.body.options[0].votes).toBe(1);
      });

    expect(prisma.opcao.updateMany).toHaveBeenCalledWith({
      where: { id: 20n, enqueteId: 10n },
      data: { votes: { increment: 1 } },
    });
  });

  it('requires a session only when the poll requires login', async () => {
    prisma.enquete.findUnique.mockResolvedValue({
      ...enquete,
      voteRequireLogin: true,
    });

    await request(app.getHttpServer())
      .post('/polls/vote')
      .send({ pollId: 10, optionId: 20 })
      .expect(401);

    expect(prisma.opcao.updateMany).not.toHaveBeenCalled();
  });
});
