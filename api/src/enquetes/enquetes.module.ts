import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EnquetesController } from './enquetes.controller';
import { EnquetesService } from './enquetes.service';
import { EnquetesSimilarityService } from './enquetes-similarity.service';

@Module({
  imports: [AuthModule],
  controllers: [EnquetesController],
  providers: [EnquetesService, EnquetesSimilarityService],
  exports: [EnquetesService, EnquetesSimilarityService],
})
export class EnquetesModule {}
