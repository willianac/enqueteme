import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EnquetesController } from './enquetes.controller';
import { EnquetesService } from './enquetes.service';

@Module({
  imports: [AuthModule],
  controllers: [EnquetesController],
  providers: [EnquetesService],
})
export class EnquetesModule {}
