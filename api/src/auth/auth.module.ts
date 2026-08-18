import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleOidcService } from './google-oidc.service';
import { SessionGuard } from './session.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, GoogleOidcService, SessionGuard],
  exports: [AuthService, SessionGuard],
})
export class AuthModule {}
