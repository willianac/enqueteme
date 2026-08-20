import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.service';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toSafeNumber } from '../prisma/to-safe-number';
import { CreateEnqueteDto } from './create-enquete.dto';
import { CreateVotoDto } from './create-voto.dto';
import { UpdateEnqueteDto } from './update-enquete.dto';

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

  async findMine(usuario: AuthenticatedUser) {
    const enquetes = await this.prisma.enquete.findMany({
      where: { usuarioId: BigInt(usuario.id) },
      include: { usuario: true, opcoes: true },
    });

    return enquetes.map((enquete) => this.toResponse(enquete));
  }

  async close(id: number, usuario: AuthenticatedUser) {
    const enquete = await this.assertOwnedPoll(id, usuario.id);

    const now = new Date();
    const updated = await this.prisma.enquete.update({
      where: { id: enquete.id },
      data: { expirationDate: now, updatedAt: now },
      include: { usuario: true, opcoes: true },
    });

    return this.toResponse(updated);
  }

  async remove(id: number, usuario: AuthenticatedUser) {
    const enquete = await this.assertOwnedPoll(id, usuario.id);
    await this.prisma.enquete.delete({ where: { id: enquete.id } });
  }

  async update(id: number, usuario: AuthenticatedUser, body: UpdateEnqueteDto) {
    const enquete = await this.assertOwnedPoll(id, usuario.id);

    const voteCount = await this.prisma.voto.count({
      where: { enqueteId: enquete.id },
    });

    if (voteCount > 0) {
      throw new ConflictException('Poll already has votes and cannot be edited.');
    }

    const now = new Date();
    const updateData: {
      title: string;
      updatedAt: Date;
      voteRequireLogin?: boolean;
      expirationDate?: Date;
    } = {
      title: body.title,
      updatedAt: now,
    };

    if (body.voteRequireLogin !== undefined) {
      updateData.voteRequireLogin = body.voteRequireLogin;
    }

    if (body.pollExpirationInDays !== undefined) {
      const expirationDate = new Date(now);
      expirationDate.setUTCDate(
        expirationDate.getUTCDate() + body.pollExpirationInDays,
      );
      updateData.expirationDate = expirationDate;
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.opcao.deleteMany({
        where: { enqueteId: enquete.id },
      });

      const updated = await transaction.enquete.update({
        where: { id: enquete.id },
        data: {
          ...updateData,
          opcoes: {
            create: body.options.map((name) => ({ name, votes: 0n })),
          },
        },
        include: { usuario: true, opcoes: true },
      });

      return this.toResponse(updated);
    });
  }

  private async assertOwnedPoll(id: number, userId: number) {
    const enquete = await this.prisma.enquete.findUnique({
      where: { id: BigInt(id) },
      include: { usuario: true, opcoes: true },
    });

    if (!enquete) {
      throw new NotFoundException('Poll not found.');
    }

    if (!enquete.usuarioId || enquete.usuarioId !== BigInt(userId)) {
      throw new ForbiddenException('You do not own this poll.');
    }

    return enquete;
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
      const optionId = BigInt(body.optionId);
      const enquete = await transaction.enquete.findUnique({
        where: { id: pollId },
        include: { usuario: true, opcoes: true },
      });

      if (!enquete) {
        throw new BadRequestException('Poll not found.');
      }

      if (enquete.expirationDate && enquete.expirationDate <= new Date()) {
        throw new BadRequestException('Poll has expired.');
      }

      if (enquete.voteRequireLogin && !usuario) {
        throw new UnauthorizedException();
      }

      const optionBelongsToPoll = enquete.opcoes.some(
        (opcao) => opcao.id === optionId,
      );
      if (!optionBelongsToPoll) {
        throw new BadRequestException('Option not found in poll.');
      }

      try {
        await transaction.voto.create({
          data: {
            enqueteId: pollId,
            opcaoId: optionId,
            usuarioId: usuario ? BigInt(usuario.id) : null,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException('User has already voted on this poll.');
        }
        throw error;
      }

      await transaction.opcao.updateMany({
        where: { id: optionId, enqueteId: pollId },
        data: { votes: { increment: 1 } },
      });

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
