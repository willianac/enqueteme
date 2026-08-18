import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser = require('cookie-parser');
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { GoogleOidcService } from '../src/auth/google-oidc.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Authentication API', () => {
  let app: INestApplication;
  const usuario = {
    id: 1n,
    googleSubject: 'google-123',
    email: 'will@example.com',
    name: 'Will',
  };
  const prisma = {
    usuario: {
      upsert: jest.fn(),
    },
    sessao: {
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
    enquete: {
      findMany: jest.fn(),
    },
  };
  const google = {
    authorizationUrl: jest.fn(),
    profile: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(GoogleOidcService)
      .useValue(google)
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
    google.authorizationUrl.mockImplementation(
      (state: string, nonce: string) =>
        `https://accounts.google.test/auth?state=${state}&nonce=${nonce}`,
    );
    google.profile.mockResolvedValue({
      subject: usuario.googleSubject,
      email: usuario.email,
      name: usuario.name,
    });
    prisma.usuario.upsert.mockResolvedValue(usuario);
    prisma.sessao.create.mockResolvedValue({});
    prisma.sessao.deleteMany.mockResolvedValue({ count: 0 });
  });

  afterAll(() => app.close());

  it('starts Google login with protected state and nonce cookies', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/google')
      .expect(302);

    expect(response.headers.location).toContain('https://accounts.google.test');
    expect(thisCookie(response, 'enqueteme_oidc_state')).toBeDefined();
    expect(thisCookie(response, 'enqueteme_oidc_nonce')).toBeDefined();
    expect(setCookies(response).every((cookie) => cookie.includes('HttpOnly'))).toBe(
      true,
    );
  });

  it('creates a local session after a valid Google callback', async () => {
    const response = await login();

    expect(response.headers.location).toBe('http://localhost:4200/polls');
    expect(thisCookie(response, 'enqueteme_session')).toBeDefined();
    expect(setCookies(response).join(';')).toContain('Max-Age=2592000');
    expect(prisma.usuario.upsert).toHaveBeenCalledWith({
      where: { googleSubject: usuario.googleSubject },
      update: { email: usuario.email, name: usuario.name },
      create: {
        googleSubject: usuario.googleSubject,
        email: usuario.email,
        name: usuario.name,
      },
    });
  });

  it('reuses the Google identity while creating independent device sessions', async () => {
    await login();
    await login();

    expect(prisma.usuario.upsert).toHaveBeenCalledTimes(2);
    const firstHash = prisma.sessao.create.mock.calls[0][0].data.tokenHash;
    const secondHash = prisma.sessao.create.mock.calls[1][0].data.tokenHash;
    expect(firstHash).not.toBe(secondHash);
  });

  it('rejects a callback whose state does not match', async () => {
    const start = await request(app.getHttpServer()).get('/auth/google');
    const cookies = requestCookies(start);

    const response = await request(app.getHttpServer())
      .get('/auth/google/callback?code=valid-code&state=wrong-state')
      .set('Cookie', cookies)
      .expect(302);

    expect(response.headers.location).toBe(
      'http://localhost:4200/signin?error=google_auth_failed',
    );
    expect(google.profile).not.toHaveBeenCalled();
  });

  it('restores the authenticated user from a valid session', async () => {
    prisma.sessao.findUnique.mockResolvedValue({
      tokenHash: 'stored-hash',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      usuarioId: usuario.id,
      usuario,
    });

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'enqueteme_session=raw-session-token')
      .expect(200)
      .expect({ id: 1, name: 'Will', email: 'will@example.com' });
  });

  it('rejects and deletes an expired session', async () => {
    prisma.sessao.findUnique.mockResolvedValue({
      tokenHash: 'expired-hash',
      createdAt: new Date(Date.now() - 120_000),
      expiresAt: new Date(Date.now() - 60_000),
      usuarioId: usuario.id,
      usuario,
    });

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', 'enqueteme_session=expired-token')
      .expect(401);

    expect(prisma.sessao.delete).toHaveBeenCalledWith({
      where: { tokenHash: 'expired-hash' },
    });
  });

  it('logs out only the current session and clears its cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', 'enqueteme_session=current-token')
      .expect(204);

    expect(prisma.sessao.deleteMany).toHaveBeenCalledTimes(1);
    expect(setCookies(response).join(';')).toContain(
      'enqueteme_session=; Path=/; Expires=',
    );
  });

  async function login() {
    const start = await request(app.getHttpServer()).get('/auth/google');
    const state = cookieValue(start, 'enqueteme_oidc_state');

    return request(app.getHttpServer())
      .get(`/auth/google/callback?code=valid-code&state=${state}`)
      .set('Cookie', requestCookies(start))
      .expect(302);
  }
});

type CookieResponse = {
  headers: Record<string, string | string[] | undefined>;
};

function setCookies(response: CookieResponse) {
  const cookies = response.headers['set-cookie'];
  return Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
}

function thisCookie(response: CookieResponse, name: string) {
  return setCookies(response).find((cookie) => cookie.startsWith(`${name}=`));
}

function cookieValue(response: CookieResponse, name: string) {
  const cookie = thisCookie(response, name);
  if (!cookie) {
    throw new Error(`${name} cookie not found`);
  }
  return cookie.split(';', 1)[0].slice(name.length + 1);
}

function requestCookies(response: CookieResponse) {
  return setCookies(response).map((cookie) => cookie.split(';', 1)[0]);
}
