import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.service';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toSafeNumber } from '../prisma/to-safe-number';
import { CreateEnqueteDto } from './create-enquete.dto';
import { CreateVotoDto } from './create-voto.dto';

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

  async create(body: CreateEnqueteDto, usuario: AuthenticatedUser) {
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
        usuario: { connect: { id: BigInt(usuario.id) } },
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
        id: usuario.id,
        name: usuario.name,
      },
      options: this.options(enquete),
    };
  }

  async vote(body: CreateVotoDto, usuario: AuthenticatedUser | null) {
    return this.prisma.$transaction(async (transaction) => {
      const pollId = BigInt(body.pollId);
      const enquete = await transaction.enquete.findUnique({
        where: { id: pollId },
        include: { usuario: true, opcoes: true },
      });

      if (!enquete) {
        throw new BadRequestException('Poll not found.');
      }

      if (enquete.voteRequireLogin && !usuario) {
        throw new UnauthorizedException();
      }

      const updated = await transaction.opcao.updateMany({
        where: { id: BigInt(body.optionId), enqueteId: pollId },
        data: { votes: { increment: 1 } },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Option not found in poll.');
      }

      const result = await transaction.enquete.findUniqueOrThrow({
        where: { id: pollId },
        include: { usuario: true, opcoes: true },
      });

      return this.toResponse(result);
    });
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
