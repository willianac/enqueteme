import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser = require('cookie-parser');
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AiService } from '../src/ai/ai.service';

describe('AI API (Neutrality & Bias Inspector)', () => {
  let app: INestApplication;
  let aiService: AiService;

  const prisma = {
    sessao: {
      findUnique: jest.fn(),
    },
  };

  const usuario = {
    id: 1n,
    googleSubject: 'google-123',
    email: 'will@example.com',
    name: 'Will',
  };

  beforeAll(async () => {
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

    aiService = module.get<AiService>(AiService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests with 401', async () => {
    await request(app.getHttpServer())
      .post('/ai/inspect-bias')
      .send({
        title: 'Qual linguagem você prefere?',
        options: ['TypeScript', 'Python'],
      })
      .expect(401);
  });

  it('rejects invalid payloads with 400 when options have fewer than 2 items', async () => {
    prisma.sessao.findUnique.mockResolvedValueOnce({
      id: 100n,
      expiresAt: new Date(Date.now() + 60_000),
      usuarioId: 1n,
      usuario,
    });

    await request(app.getHttpServer())
      .post('/ai/inspect-bias')
      .set('Cookie', 'enqueteme_session=mock-session-token')
      .send({
        title: 'Qual linguagem você prefere?',
        options: ['TypeScript'],
      })
      .expect(400);
  });

  it('rejects invalid payloads with 400 when title is missing or empty', async () => {
    prisma.sessao.findUnique.mockResolvedValueOnce({
      id: 100n,
      expiresAt: new Date(Date.now() + 60_000),
      usuarioId: 1n,
      usuario,
    });

    await request(app.getHttpServer())
      .post('/ai/inspect-bias')
      .set('Cookie', 'enqueteme_session=mock-session-token')
      .send({
        title: '',
        options: ['TypeScript', 'Python'],
      })
      .expect(400);
  });

  it('returns 201 and structured bias inspection when authenticated and valid', async () => {
    prisma.sessao.findUnique.mockResolvedValueOnce({
      id: 100n,
      expiresAt: new Date(Date.now() + 60_000),
      usuarioId: 1n,
      usuario,
    });

    const response = await request(app.getHttpServer())
      .post('/ai/inspect-bias')
      .set('Cookie', 'enqueteme_session=mock-session-token')
      .send({
        title: 'Você concorda que TypeScript é indispensável?',
        options: ['Sim, com certeza', 'Sim, bastante'],
      })
      .expect(201);

    expect(response.body).toHaveProperty('isNeutral');
    expect(response.body).toHaveProperty('score');
    expect(response.body).toHaveProperty('summary');
    expect(response.body).toHaveProperty('issues');
    expect(Array.isArray(response.body.issues)).toBe(true);
    expect(response.body).toHaveProperty('suggestedTitle');
    expect(response.body).toHaveProperty('suggestedOptionsToAdd');
  });
});
