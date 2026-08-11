import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Enquetes API', () => {
  let app: INestApplication;
  const prisma = {
    $transaction: jest.fn(),
    usuario: {
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
  const usuario = { id: 1n, name: 'Will' };
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
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  afterEach(() => jest.clearAllMocks());
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
      .expect(400);
  });

  it('rejects an unknown user', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post('/polls')
      .send({ title: 'Question', options: ['A', 'B'], userId: 99 })
      .expect(400);
  });

  it('creates a poll with a seven-day default expiration', async () => {
    prisma.usuario.findUnique.mockResolvedValue(usuario);
    prisma.enquete.create.mockResolvedValue(enquete);

    await request(app.getHttpServer())
      .post('/polls')
      .send({
        title: 'Melhor framework?',
        options: ['NestJS', 'Spring'],
        userId: 1,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.id).toBe(10);
        expect(response.body.options).toHaveLength(2);
      });

    const data = prisma.enquete.create.mock.calls[0][0].data;
    expect(data.expirationDate.getTime() - data.createdAt.getTime()).toBe(
      7 * 24 * 60 * 60 * 1000,
    );
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
});
