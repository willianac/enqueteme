import { Injectable, OnModuleInit } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { GoogleProfile } from './auth.service';

@Injectable()
export class GoogleOidcService implements OnModuleInit {
  private client!: OAuth2Client;
  private clientId!: string;
  private callbackUrl!: string;

  onModuleInit() {
    this.clientId = this.required('GOOGLE_CLIENT_ID');
    this.callbackUrl = this.required('GOOGLE_CALLBACK_URL');
    this.client = new OAuth2Client({
      clientId: this.clientId,
      clientSecret: this.required('GOOGLE_CLIENT_SECRET'),
      redirectUri: this.callbackUrl,
    });
  }

  authorizationUrl(state: string, nonce: string) {
    return this.client.generateAuthUrl({
      access_type: 'online',
      scope: ['openid', 'email', 'profile'],
      state,
      nonce,
    });
  }

  async profile(code: string, expectedNonce: string): Promise<GoogleProfile> {
    const { tokens } = await this.client.getToken({
      code,
      redirect_uri: this.callbackUrl,
    });

    if (!tokens.id_token) {
      throw new Error('Google did not return an ID token');
    }

    const ticket = await this.client.verifyIdToken({
      idToken: tokens.id_token,
      audience: this.clientId,
    });
    const payload = ticket.getPayload();

    if (
      !payload?.sub ||
      !payload.email ||
      payload.email_verified !== true ||
      payload.nonce !== expectedNonce
    ) {
      throw new Error('Google identity could not be verified');
    }

    return {
      subject: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
    };
  }

  private required(name: string) {
    const value = process.env[name];
    if (!value) {
      throw new Error(`${name} is required`);
    }
    return value;
  }
}
