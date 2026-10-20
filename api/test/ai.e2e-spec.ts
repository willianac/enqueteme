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

  describe('POST /ai/explain-poll', () => {
    it('rejects unauthenticated requests with 401', async () => {
      await request(app.getHttpServer())
        .post('/ai/explain-poll')
        .send({
          pollId: 1,
          title: 'TypeScript vs Python para backend?',
          options: ['TypeScript', 'Python'],
        })
        .expect(401);
    });

    it('rejects invalid payloads with 400 when pollId is invalid or missing', async () => {
      prisma.sessao.findUnique.mockResolvedValueOnce({
        id: 100n,
        expiresAt: new Date(Date.now() + 60_000),
        usuarioId: 1n,
        usuario,
      });

      await request(app.getHttpServer())
        .post('/ai/explain-poll')
        .set('Cookie', 'enqueteme_session=mock-session-token')
        .send({
          pollId: 0,
          title: 'TypeScript vs Python',
          options: ['TypeScript', 'Python'],
        })
        .expect(400);
    });

    it('rejects invalid payloads with 400 when options have fewer than 2 items', async () => {
      prisma.sessao.findUnique.mockResolvedValueOnce({
        id: 100n,
        expiresAt: new Date(Date.now() + 60_000),
        usuarioId: 1n,
        usuario,
      });

      await request(app.getHttpServer())
        .post('/ai/explain-poll')
        .set('Cookie', 'enqueteme_session=mock-session-token')
        .send({
          pollId: 1,
          title: 'TypeScript vs Python',
          options: ['TypeScript'],
        })
        .expect(400);
    });

    it('returns 201 with overview and options analysis when authenticated and valid', async () => {
      prisma.sessao.findUnique.mockResolvedValue({
        id: 100n,
        expiresAt: new Date(Date.now() + 60_000),
        usuarioId: 1n,
        usuario,
      });

      const response = await request(app.getHttpServer())
        .post('/ai/explain-poll')
        .set('Cookie', 'enqueteme_session=mock-session-token')
        .send({
          pollId: 10,
          title: 'TypeScript vs Python para novas APIs',
          options: ['TypeScript', 'Python'],
        })
        .expect(201);

      expect(response.body).toHaveProperty('pollId', 10);
      expect(response.body).toHaveProperty('overview');
      expect(typeof response.body.overview).toBe('string');
      expect(response.body).toHaveProperty('options');
      expect(Array.isArray(response.body.options)).toBe(true);
      expect(response.body.options).toHaveLength(2);

      const tsOption = response.body.options.find(
        (o: any) => o.name === 'TypeScript',
      );
      expect(tsOption).toBeDefined();
      expect(Array.isArray(tsOption.pros)).toBe(true);
      expect(Array.isArray(tsOption.cons)).toBe(true);
      expect(tsOption.pros.length).toBeGreaterThan(0);
      expect(tsOption.cons.length).toBeGreaterThan(0);

      // Verify in-memory cache hit for subsequent request
      const cachedResponse = await request(app.getHttpServer())
        .post('/ai/explain-poll')
        .set('Cookie', 'enqueteme_session=mock-session-token')
        .send({
          pollId: 10,
          title: 'TypeScript vs Python para novas APIs',
          options: ['TypeScript', 'Python'],
        })
        .expect(201);

      expect(cachedResponse.body).toEqual(response.body);
    });
  });

  describe('POST /ai/generate-from-content', () => {
    it('rejects unauthenticated requests with 401', async () => {
      await request(app.getHttpServer())
        .post('/ai/generate-from-content')
        .send({
          type: 'text',
          content: 'Qualquer texto longo o suficiente para passar na validação de tamanho mínimo...',
        })
        .expect(401);
    });

    it('rejects invalid payload with 400 when type is invalid', async () => {
      prisma.sessao.findUnique.mockResolvedValueOnce({
        id: 100n,
        expiresAt: new Date(Date.now() + 60_000),
        usuarioId: 1n,
        usuario,
      });

      await request(app.getHttpServer())
        .post('/ai/generate-from-content')
        .set('Cookie', 'enqueteme_session=mock-session-token')
        .send({
          type: 'invalid',
          content: 'Texto qualquer com mais de 50 caracteres para testar a validação.',
        })
        .expect(400);
    });

    it('rejects invalid payload with 400 when content is empty', async () => {
      prisma.sessao.findUnique.mockResolvedValueOnce({
        id: 100n,
        expiresAt: new Date(Date.now() + 60_000),
        usuarioId: 1n,
        usuario,
      });

      await request(app.getHttpServer())
        .post('/ai/generate-from-content')
        .set('Cookie', 'enqueteme_session=mock-session-token')
        .send({
          type: 'text',
          content: '',
        })
        .expect(400);
    });

    it('rejects SSRF attempt to localhost with 400', async () => {
      prisma.sessao.findUnique.mockResolvedValueOnce({
        id: 100n,
        expiresAt: new Date(Date.now() + 60_000),
        usuarioId: 1n,
        usuario,
      });

      const response = await request(app.getHttpServer())
        .post('/ai/generate-from-content')
        .set('Cookie', 'enqueteme_session=mock-session-token')
        .send({
          type: 'url',
          content: 'http://localhost:8080/admin',
        })
        .expect(400);

      expect(response.body.message).toContain('endereço local ou não permitido');
    });

    it('rejects SSRF attempt to cloud metadata IP with 400', async () => {
      prisma.sessao.findUnique.mockResolvedValueOnce({
        id: 100n,
        expiresAt: new Date(Date.now() + 60_000),
        usuarioId: 1n,
        usuario,
      });

      const response = await request(app.getHttpServer())
        .post('/ai/generate-from-content')
        .set('Cookie', 'enqueteme_session=mock-session-token')
        .send({
          type: 'url',
          content: 'http://169.254.169.254/latest/meta-data',
        })
        .expect(400);

      expect(response.body.message).toContain('metadados não permitido');
    });

    it('rejects text content shorter than 50 characters with 400', async () => {
      prisma.sessao.findUnique.mockResolvedValueOnce({
        id: 100n,
        expiresAt: new Date(Date.now() + 60_000),
        usuarioId: 1n,
        usuario,
      });

      const response = await request(app.getHttpServer())
        .post('/ai/generate-from-content')
        .set('Cookie', 'enqueteme_session=mock-session-token')
        .send({
          type: 'text',
          content: 'Texto muito curto',
        })
        .expect(400);

      expect(response.body.message).toContain('mínimo de 50 caracteres');
    });

    it('returns 201 with title, options, and contextRationale when authenticated and valid text', async () => {
      prisma.sessao.findUnique.mockResolvedValueOnce({
        id: 100n,
        expiresAt: new Date(Date.now() + 60_000),
        usuarioId: 1n,
        usuario,
      });

      const response = await request(app.getHttpServer())
        .post('/ai/generate-from-content')
        .set('Cookie', 'enqueteme_session=mock-session-token')
        .send({
          type: 'text',
          content:
            'A equipe de engenharia está debatendo a transição da arquitetura legada de microsserviços para um monólito modular. Enquanto defensores do monólito apontam menor latência de rede, facilidade de debugging e deploys atômicos mais simples, os defensores dos microsserviços argumentam sobre autonomia de times independentes e escalabilidade horizontal isolada.',
        })
        .expect(201);

      expect(response.body).toHaveProperty('title');
      expect(typeof response.body.title).toBe('string');
      expect(response.body).toHaveProperty('options');
      expect(Array.isArray(response.body.options)).toBe(true);
      expect(response.body.options.length).toBeGreaterThanOrEqual(2);
      expect(response.body.options.length).toBeLessThanOrEqual(5);
      expect(response.body).toHaveProperty('contextRationale');
      expect(typeof response.body.contextRationale).toBe('string');
      expect(response.body.contextRationale.length).toBeGreaterThan(0);
    });
  });
});

