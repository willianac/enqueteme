import { randomBytes, timingSafeEqual } from 'node:crypto';
import {
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  AuthService,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from './auth.service';
import { GoogleOidcService } from './google-oidc.service';

const STATE_COOKIE = 'enqueteme_oidc_state';
const NONCE_COOKIE = 'enqueteme_oidc_nonce';
const OIDC_MAX_AGE = 10 * 60 * 1000;

@Controller('auth')
export class AuthController {
  private readonly webUrl = this.requiredUrl('WEB_URL');
  private readonly secureCookies =
    this.requiredUrl('GOOGLE_CALLBACK_URL').protocol === 'https:';

  constructor(
    private readonly auth: AuthService,
    private readonly google: GoogleOidcService,
  ) {}

  @Get('google')
  googleLogin(@Res() response: Response) {
    const state = randomBytes(32).toString('base64url');
    const nonce = randomBytes(32).toString('base64url');
    const options = this.cookieOptions(OIDC_MAX_AGE);

    response.cookie(STATE_COOKIE, state, options);
    response.cookie(NONCE_COOKIE, nonce, options);
    response.redirect(this.google.authorizationUrl(state, nonce));
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      const expectedState = request.cookies?.[STATE_COOKIE] as
        | string
        | undefined;
      const expectedNonce = request.cookies?.[NONCE_COOKIE] as
        | string
        | undefined;

      if (!code || !expectedNonce || !this.matches(state, expectedState)) {
        throw new Error('Invalid Google callback');
      }

      const profile = await this.google.profile(code, expectedNonce);
      const { token } = await this.auth.createSession(profile);

      this.clearOidcCookies(response);
      response.cookie(
        SESSION_COOKIE,
        token,
        this.cookieOptions(SESSION_MAX_AGE),
      );
      response.redirect(new URL('/polls', this.webUrl).toString());
    } catch {
      this.clearOidcCookies(response);
      response.redirect(
        new URL('/signin?error=google_auth_failed', this.webUrl).toString(),
      );
    }
  }

  @Get('me')
  async me(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.auth.resolveSession(
      request.cookies?.[SESSION_COOKIE] as string | undefined,
    );

    if (!user) {
      response.clearCookie(SESSION_COOKIE, this.cookieOptions());
      throw new UnauthorizedException();
    }

    return user;
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.deleteSession(
      request.cookies?.[SESSION_COOKIE] as string | undefined,
    );
    response.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }

  private matches(actual?: string, expected?: string) {
    if (!actual || !expected) {
      return false;
    }

    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    return (
      actualBuffer.length === expectedBuffer.length &&
      timingSafeEqual(actualBuffer, expectedBuffer)
    );
  }

  private clearOidcCookies(response: Response) {
    response.clearCookie(STATE_COOKIE, this.cookieOptions());
    response.clearCookie(NONCE_COOKIE, this.cookieOptions());
  }

  private cookieOptions(maxAge?: number) {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.secureCookies,
      path: '/',
      ...(maxAge === undefined ? {} : { maxAge }),
    };
  }

  private requiredUrl(name: string) {
    const value = process.env[name];
    if (!value) {
      throw new Error(`${name} is required`);
    }
    return new URL(value);
  }
}
