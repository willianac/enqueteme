import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toSafeNumber } from '../prisma/to-safe-number';
import { CreateEnqueteDto } from './create-enquete.dto';

type EnqueteCompleta = Prisma.EnqueteGetPayload<{
  include: { usuario: true; opcoes: true };
}>;

@Injectable()
export class EnquetesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const enquetes = await this.prisma.enquete.findMany({
      include: { usuario: true, opcoes: true },
    });

    return enquetes.map((enquete) => this.toResponse(enquete));
  }

  async create(body: CreateEnqueteDto) {
    if (
      body.title == null ||
      body.title.length === 0 ||
      body.options == null ||
      body.options.length < 2 ||
      body.userId == null
    ) {
      throw new BadRequestException(
        'Invalid poll data. Title and at least two options are required.',
      );
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: BigInt(body.userId) },
    });

    if (!usuario) {
      throw new BadRequestException('User not found.');
    }

    const now = new Date();
    const expirationDate = new Date(now);
    expirationDate.setUTCDate(
      expirationDate.getUTCDate() + (body.pollExpirationInDays ?? 7),
    );

    const enquete = await this.prisma.enquete.create({
      data: {
        title: body.title,
        createdAt: now,
        updatedAt: now,
        voteRequireLogin: body.voteRequireLogin ?? false,
        expirationDate,
        usuario: { connect: { id: usuario.id } },
        opcoes: {
          create: body.options.map((name) => ({ name, votes: 0n })),
        },
      },
      include: { usuario: true, opcoes: true },
    });

    return {
      id: toSafeNumber(enquete.id),
      title: enquete.title,
      createdAt: enquete.createdAt,
      updatedAt: enquete.updatedAt,
      voteRequireLogin: enquete.voteRequireLogin,
      expirationDate: enquete.expirationDate,
      user: {
        id: toSafeNumber(usuario.id),
        name: usuario.name,
      },
      options: this.options(enquete),
    };
  }

  private toResponse(enquete: EnqueteCompleta) {
    return {
      id: toSafeNumber(enquete.id),
      title: enquete.title,
      creatorName: enquete.usuario?.name,
      expirationDate: enquete.expirationDate,
      voteRequireLogin: enquete.voteRequireLogin,
      options: this.options(enquete),
    };
  }

  private options(enquete: EnqueteCompleta) {
    return enquete.opcoes.map((opcao) => ({
      id: toSafeNumber(opcao.id),
      name: opcao.name,
      votes: toSafeNumber(opcao.votes ?? 0n),
    }));
  }
}
