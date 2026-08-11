import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toSafeNumber } from '../prisma/to-safe-number';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(name: string) {
    const existing = await this.prisma.usuario.findFirst({
      where: { name },
    });
    const usuario =
      existing ?? (await this.prisma.usuario.create({ data: { name } }));

    return {
      id: toSafeNumber(usuario.id),
      name: usuario.name,
    };
  }
}
