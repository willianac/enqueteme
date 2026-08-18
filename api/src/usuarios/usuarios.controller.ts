import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CreateUsuarioDto } from './create-usuario.dto';
import { UsuariosService } from './usuarios.service';

@Controller('user')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  healthCheck() {
    return 'Usuario endpoint ok';
  }

  @Post()
  @HttpCode(200)
  create(@Body() body: CreateUsuarioDto) {
    return this.usuariosService.findOrCreate(body.name);
  }
}
