import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleOidcService } from './google-oidc.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, GoogleOidcService],
  exports: [AuthService],
})
export class AuthModule {}
