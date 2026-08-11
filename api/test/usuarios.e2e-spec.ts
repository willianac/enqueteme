import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Usuarios API', () => {
  let app: INestApplication;
  const prisma = {
    usuario: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeAll(async () => {
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

  it('reports that the endpoint is healthy', async () => {
    await request(app.getHttpServer())
      .get('/user')
      .expect(200)
      .expect('Usuario endpoint ok');
  });

  it('returns an existing user with the same name', async () => {
    prisma.usuario.findFirst.mockResolvedValue({ id: 1n, name: 'Will' });

    await request(app.getHttpServer())
      .post('/user')
      .send({ name: 'Will' })
      .expect(200)
      .expect({ id: 1, name: 'Will' });

    expect(prisma.usuario.create).not.toHaveBeenCalled();
  });

  it('creates a user when the name is new', async () => {
    prisma.usuario.findFirst.mockResolvedValue(null);
    prisma.usuario.create.mockResolvedValue({ id: 2n, name: 'Ana' });

    await request(app.getHttpServer())
      .post('/user')
      .send({ name: 'Ana' })
      .expect(200)
      .expect({ id: 2, name: 'Ana' });
  });

  it('rejects a blank user name', async () => {
    await request(app.getHttpServer())
      .post('/user')
      .send({ name: '   ' })
      .expect(400);
  });
});
