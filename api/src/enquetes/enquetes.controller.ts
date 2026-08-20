import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
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
import { UpdateEnqueteDto } from './update-enquete.dto';

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

  @Get('mine')
  @UseGuards(SessionGuard)
  findMine(@Req() request: AuthenticatedRequest) {
    return this.enquetesService.findMine(request.user);
  }

  @Patch(':id/close')
  @UseGuards(SessionGuard)
  close(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.enquetesService.close(id, request.user);
  }

  @Patch(':id')
  @UseGuards(SessionGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateEnqueteDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.enquetesService.update(id, request.user, body);
  }

  @Delete(':id')
  @UseGuards(SessionGuard)
  @HttpCode(204)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.enquetesService.remove(id, request.user);
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
