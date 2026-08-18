import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService, SESSION_COOKIE } from '../auth/auth.service';
import {
  AuthenticatedRequest,
  SessionGuard,
} from '../auth/session.guard';
import { CreateEnqueteDto } from './create-enquete.dto';
import { CreateVotoDto } from './create-voto.dto';
import { EnquetesService } from './enquetes.service';

@Controller('polls')
export class EnquetesController {
  constructor(
    private readonly enquetesService: EnquetesService,
    private readonly auth: AuthService,
  ) {}

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
  @UseGuards(SessionGuard)
  create(
    @Body() body: CreateEnqueteDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.enquetesService.create(body, request.user);
  }

  @Post('vote')
  @HttpCode(200)
  async vote(@Body() body: CreateVotoDto, @Req() request: Request) {
    const user = await this.auth.resolveSession(
      request.cookies?.[SESSION_COOKIE] as string | undefined,
    );
    return this.enquetesService.vote(body, user);
  }
}
