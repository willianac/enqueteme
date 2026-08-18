import { Module } from '@nestjs/common';
import { EnquetesController } from './enquetes.controller';
import { EnquetesService } from './enquetes.service';

@Module({
  controllers: [EnquetesController],
  providers: [EnquetesService],
})
export class EnquetesModule {}
