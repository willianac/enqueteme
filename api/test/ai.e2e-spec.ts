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

  describe('POST /ai/generate-poll', () => {
    it('rejects unauthenticated requests with 401', async () => {
      await request(app.getHttpServer())
        .post('/ai/generate-poll')
        .send({
          prompt: 'Qual o melhor banco de dados para analytics?',
        })
        .expect(401);
    });

    it('rejects invalid payloads with 400 when prompt is empty or too short', async () => {
      prisma.sessao.findUnique.mockResolvedValueOnce({
        id: 100n,
        expiresAt: new Date(Date.now() + 60_000),
        usuarioId: 1n,
        usuario,
      });

      await request(app.getHttpServer())
        .post('/ai/generate-poll')
        .set('Cookie', 'enqueteme_session=mock-session-token')
        .send({
          prompt: 'ab',
        })
        .expect(400);
    });

    it('rejects invalid payloads with 400 when prompt exceeds 300 characters', async () => {
      prisma.sessao.findUnique.mockResolvedValueOnce({
        id: 100n,
        expiresAt: new Date(Date.now() + 60_000),
        usuarioId: 1n,
        usuario,
      });

      await request(app.getHttpServer())
        .post('/ai/generate-poll')
        .set('Cookie', 'enqueteme_session=mock-session-token')
        .send({
          prompt: 'a'.repeat(301),
        })
        .expect(400);
    });

    it('returns 201 with generated title and options when authenticated and valid', async () => {
      prisma.sessao.findUnique.mockResolvedValueOnce({
        id: 100n,
        expiresAt: new Date(Date.now() + 60_000),
        usuarioId: 1n,
        usuario,
      });

      const response = await request(app.getHttpServer())
        .post('/ai/generate-poll')
        .set('Cookie', 'enqueteme_session=mock-session-token')
        .send({
          prompt: 'Melhor banco de dados para analytics em tempo real',
        })
        .expect(201);

      expect(response.body).toHaveProperty('title');
      expect(typeof response.body.title).toBe('string');
      expect(response.body).toHaveProperty('options');
      expect(Array.isArray(response.body.options)).toBe(true);
      expect(response.body.options.length).toBeGreaterThanOrEqual(2);
      expect(response.body.options.length).toBeLessThanOrEqual(5);
    });

    it('returns 201 with generated title and options when currentOptions is provided', async () => {
      prisma.sessao.findUnique.mockResolvedValueOnce({
        id: 100n,
        expiresAt: new Date(Date.now() + 60_000),
        usuarioId: 1n,
        usuario,
      });

      const response = await request(app.getHttpServer())
        .post('/ai/generate-poll')
        .set('Cookie', 'enqueteme_session=mock-session-token')
        .send({
          prompt: 'Bancos para analytics em tempo real',
          currentOptions: ['ClickHouse', 'Pinot'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('options');
      expect(response.body.options.length).toBeGreaterThanOrEqual(2);
    });
  });
});

