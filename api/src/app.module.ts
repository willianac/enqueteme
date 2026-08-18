import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { EnquetesModule } from './enquetes/enquetes.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, EnquetesModule],
})
export class AppModule {}
