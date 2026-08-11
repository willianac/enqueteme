import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { CreateEnqueteDto } from './create-enquete.dto';
import { EnquetesService } from './enquetes.service';

@Controller('polls')
export class EnquetesController {
  constructor(private readonly enquetesService: EnquetesService) {}

  @Get()
  async findAll(
    @Res({ passthrough: true }) response: { status(code: number): unknown },
  ) {
    const enquetes = await this.enquetesService.findAll();

    if (enquetes.length === 0) {
      response.status(204);
      return;
    }

    return enquetes;
  }

  @Post()
  create(@Body() body: CreateEnqueteDto) {
    return this.enquetesService.create(body);
  }
}
