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
  Query,
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
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Res({ passthrough: true }) response: { status(code: number): unknown },
    @Req() request: Request,
  ) {
    const user = await this.auth.resolveSession(
      request.cookies?.[SESSION_COOKIE] as string | undefined,
    );
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const enquetes = await this.enquetesService.findAll(user, parsedPage, parsedLimit);

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

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    const user = await this.auth.resolveSession(
      request.cookies?.[SESSION_COOKIE] as string | undefined,
    );
    return this.enquetesService.findOne(id, user);
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
