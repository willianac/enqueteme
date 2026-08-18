import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toSafeNumber } from '../prisma/to-safe-number';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(name: string) {
    const usuario = await this.prisma.usuario.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    return {
      id: toSafeNumber(usuario.id),
      name: usuario.name,
    };
  }
}
