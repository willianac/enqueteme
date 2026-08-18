import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../src/generated/prisma/client';
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
      update: jest.fn(),
      delete: jest.fn(),
    },
    opcao: {
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    voto: {
      create: jest.fn(),
      count: jest.fn(),
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
    expirationDate: new Date('2026-08-25T12:00:00.000Z'),
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
          expirationDate: '2026-08-25T12:00:00.000Z',
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

  it('rejects a vote after the poll expires', async () => {
    prisma.enquete.findUnique.mockResolvedValue({
      ...enquete,
      expirationDate: new Date('2020-01-01T00:00:00.000Z'),
    });

    await request(app.getHttpServer())
      .post('/polls/vote')
      .send({ pollId: 10, optionId: 20 })
      .expect(400);

    expect(prisma.opcao.updateMany).not.toHaveBeenCalled();
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

    await request(app.getHttpServer())
      .post('/polls/vote')
      .send({ pollId: 10, optionId: 999 })
      .expect(400);

    expect(prisma.voto.create).not.toHaveBeenCalled();
    expect(prisma.opcao.updateMany).not.toHaveBeenCalled();
  });

  it('records an anonymous vote and increments the selected option', async () => {
    prisma.enquete.findUnique.mockResolvedValue({
      ...enquete,
      opcoes: [...enquete.opcoes],
    });
    prisma.voto.create.mockResolvedValue({ id: 1n });
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

    expect(prisma.voto.create).toHaveBeenCalledWith({
      data: {
        enqueteId: 10n,
        opcaoId: 20n,
        usuarioId: null,
      },
    });
    expect(prisma.opcao.updateMany).toHaveBeenCalledWith({
      where: { id: 20n, enqueteId: 10n },
      data: { votes: { increment: 1 } },
    });
  });

  it('records an authenticated vote with the session user', async () => {
    prisma.enquete.findUnique.mockResolvedValue({
      ...enquete,
      opcoes: [...enquete.opcoes],
    });
    prisma.voto.create.mockResolvedValue({ id: 2n });
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
      .set('Cookie', 'enqueteme_session=valid-token')
      .expect(200);

    expect(prisma.voto.create).toHaveBeenCalledWith({
      data: {
        enqueteId: 10n,
        opcaoId: 20n,
        usuarioId: 1n,
      },
    });
  });

  it('rejects a second authenticated vote on the same poll', async () => {
    prisma.enquete.findUnique.mockResolvedValue({
      ...enquete,
      opcoes: [...enquete.opcoes],
    });
    prisma.voto.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.9.1',
      }),
    );

    await request(app.getHttpServer())
      .post('/polls/vote')
      .send({ pollId: 10, optionId: 20 })
      .set('Cookie', 'enqueteme_session=valid-token')
      .expect(409);

    expect(prisma.opcao.updateMany).not.toHaveBeenCalled();
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

    expect(prisma.voto.create).not.toHaveBeenCalled();
    expect(prisma.opcao.updateMany).not.toHaveBeenCalled();
  });

  describe('GET /polls/mine', () => {
    it('returns 401 without session', async () => {
      await request(app.getHttpServer()).get('/polls/mine').expect(401);
    });

    it('returns only the session users polls', async () => {
      prisma.enquete.findMany.mockResolvedValue([enquete]);

      await request(app.getHttpServer())
        .get('/polls/mine')
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(200)
        .expect((response) => {
          expect(response.body).toHaveLength(1);
          expect(response.body[0].id).toBe(10);
        });

      expect(prisma.enquete.findMany).toHaveBeenCalledWith({
        where: { usuarioId: 1n },
        include: { usuario: true, opcoes: true },
      });
    });
  });

  describe('PATCH /polls/:id/close', () => {
    it('returns 401 without session', async () => {
      await request(app.getHttpServer())
        .patch('/polls/10/close')
        .expect(401);
    });

    it('returns 404 when poll does not exist', async () => {
      prisma.enquete.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/polls/999/close')
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(404);
    });

    it('returns 403 when user is not the owner', async () => {
      prisma.enquete.findUnique.mockResolvedValue({
        ...enquete,
        usuarioId: 999n,
      });

      await request(app.getHttpServer())
        .patch('/polls/10/close')
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(403);
    });

    it('sets expirationDate to now', async () => {
      prisma.enquete.findUnique.mockResolvedValue(enquete);
      prisma.enquete.update.mockResolvedValue({
        ...enquete,
        expirationDate: new Date(),
      });

      await request(app.getHttpServer())
        .patch('/polls/10/close')
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(200);

      expect(prisma.enquete.update).toHaveBeenCalledWith({
        where: { id: 10n },
        data: expect.objectContaining({
          expirationDate: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
        include: { usuario: true, opcoes: true },
      });
    });

    it('is idempotent when already expired', async () => {
      const expiredDate = new Date('2020-01-01T00:00:00.000Z');
      prisma.enquete.findUnique.mockResolvedValue({
        ...enquete,
        expirationDate: expiredDate,
      });
      prisma.enquete.update.mockResolvedValue({
        ...enquete,
        expirationDate: expiredDate,
      });

      await request(app.getHttpServer())
        .patch('/polls/10/close')
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(200);
    });
  });

  describe('DELETE /polls/:id', () => {
    it('returns 401 without session', async () => {
      await request(app.getHttpServer())
        .delete('/polls/10')
        .expect(401);
    });

    it('returns 404 when poll does not exist', async () => {
      prisma.enquete.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/polls/999')
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(404);
    });

    it('returns 403 when user is not the owner', async () => {
      prisma.enquete.findUnique.mockResolvedValue({
        ...enquete,
        usuarioId: 999n,
      });

      await request(app.getHttpServer())
        .delete('/polls/10')
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(403);
    });

    it('deletes the poll and returns 204', async () => {
      prisma.enquete.findUnique.mockResolvedValue(enquete);
      prisma.enquete.delete.mockResolvedValue(enquete);

      await request(app.getHttpServer())
        .delete('/polls/10')
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(204);

      expect(prisma.enquete.delete).toHaveBeenCalledWith({
        where: { id: 10n },
      });
    });
  });

  describe('PATCH /polls/:id', () => {
    it('returns 401 without session', async () => {
      await request(app.getHttpServer())
        .patch('/polls/10')
        .send({ title: 'New title', options: ['A', 'B'] })
        .expect(401);
    });

    it('returns 404 when poll does not exist', async () => {
      prisma.enquete.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/polls/999')
        .send({ title: 'New title', options: ['A', 'B'] })
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(404);
    });

    it('returns 403 when user is not the owner', async () => {
      prisma.enquete.findUnique.mockResolvedValue({
        ...enquete,
        usuarioId: 999n,
      });

      await request(app.getHttpServer())
        .patch('/polls/10')
        .send({ title: 'New title', options: ['A', 'B'] })
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(403);
    });

    it('returns 409 when poll already has votes', async () => {
      prisma.enquete.findUnique.mockResolvedValue(enquete);
      prisma.voto.count.mockResolvedValue(5);

      await request(app.getHttpServer())
        .patch('/polls/10')
        .send({ title: 'New title', options: ['A', 'B'] })
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(409);

      expect(prisma.enquete.update).not.toHaveBeenCalled();
    });

    it('updates title and options when zero votes', async () => {
      prisma.enquete.findUnique.mockResolvedValue(enquete);
      prisma.voto.count.mockResolvedValue(0);
      prisma.opcao.deleteMany.mockResolvedValue({ count: 2 });
      prisma.enquete.update.mockResolvedValue({
        ...enquete,
        title: 'New title',
        opcoes: [
          { id: 30n, name: 'Option A', votes: 0n, enqueteId: 10n },
          { id: 31n, name: 'Option B', votes: 0n, enqueteId: 10n },
        ],
      });

      await request(app.getHttpServer())
        .patch('/polls/10')
        .send({ title: 'New title', options: ['Option A', 'Option B'] })
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(200)
        .expect((response) => {
          expect(response.body.title).toBe('New title');
          expect(response.body.options).toHaveLength(2);
        });

      expect(prisma.opcao.deleteMany).toHaveBeenCalledWith({
        where: { enqueteId: 10n },
      });
    });

    it('updates voteRequireLogin flag', async () => {
      prisma.enquete.findUnique.mockResolvedValue(enquete);
      prisma.voto.count.mockResolvedValue(0);
      prisma.opcao.deleteMany.mockResolvedValue({ count: 2 });
      prisma.enquete.update.mockResolvedValue({
        ...enquete,
        voteRequireLogin: true,
      });

      await request(app.getHttpServer())
        .patch('/polls/10')
        .send({
          title: 'New title',
          options: ['A', 'B'],
          voteRequireLogin: true,
        })
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(200);

      expect(prisma.enquete.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            voteRequireLogin: true,
          }),
        }),
      );
    });

    it('recomputes expirationDate when pollExpirationInDays is provided', async () => {
      prisma.enquete.findUnique.mockResolvedValue(enquete);
      prisma.voto.count.mockResolvedValue(0);
      prisma.opcao.deleteMany.mockResolvedValue({ count: 2 });
      prisma.enquete.update.mockResolvedValue(enquete);

      await request(app.getHttpServer())
        .patch('/polls/10')
        .send({
          title: 'New title',
          options: ['A', 'B'],
          pollExpirationInDays: 14,
        })
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(200);

      expect(prisma.enquete.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expirationDate: expect.any(Date),
          }),
        }),
      );
    });

    it('returns 400 for invalid body', async () => {
      prisma.enquete.findUnique.mockResolvedValue(enquete);

      await request(app.getHttpServer())
        .patch('/polls/10')
        .send({ title: '', options: ['A'] })
        .set('Cookie', 'enqueteme_session=valid-token')
        .expect(400);
    });
  });
});
