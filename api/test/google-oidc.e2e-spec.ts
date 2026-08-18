import { GoogleOidcService } from '../src/auth/google-oidc.service';

describe('Google OIDC verification', () => {
  const service = new GoogleOidcService();
  const client = {
    getToken: jest.fn(),
    verifyIdToken: jest.fn(),
  };

  beforeAll(() => {
    service.onModuleInit();
    Reflect.set(service, 'client', client);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    client.getToken.mockResolvedValue({ tokens: { id_token: 'id-token' } });
  });

  it('accepts a verified Google identity with the expected nonce', async () => {
    client.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-123',
        email: 'will@example.com',
        email_verified: true,
        name: 'Will',
        nonce: 'expected-nonce',
      }),
    });

    await expect(service.profile('code', 'expected-nonce')).resolves.toEqual({
      subject: 'google-123',
      email: 'will@example.com',
      name: 'Will',
    });
  });

  it('rejects unverified email addresses and mismatched nonces', async () => {
    client.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-123',
        email: 'will@example.com',
        email_verified: false,
        nonce: 'wrong-nonce',
      }),
    });

    await expect(service.profile('code', 'expected-nonce')).rejects.toThrow(
      'Google identity could not be verified',
    );
  });
});
