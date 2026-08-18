import { Module } from '@nestjs/common';
import { EnquetesModule } from './enquetes/enquetes.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [PrismaModule, UsuariosModule, EnquetesModule],
})
export class AppModule {}
