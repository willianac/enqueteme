import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  AuthenticatedUser,
  AuthService,
  SESSION_COOKIE,
} from './auth.service';

export type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.auth.resolveSession(
      request.cookies?.[SESSION_COOKIE] as string | undefined,
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    request.user = user;
    return true;
  }
}
