import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthenticatedUser } from '../auth/auth.service';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toSafeNumber } from '../prisma/to-safe-number';
import { CreateEnqueteDto } from './create-enquete.dto';
import { CreateVotoDto } from './create-voto.dto';
import { UpdateEnqueteDto } from './update-enquete.dto';
import { EnquetesSimilarityService } from './enquetes-similarity.service';

type EnqueteCompleta = Prisma.EnqueteGetPayload<{
  include: { usuario: true; opcoes: true };
}> & { votos?: { opcaoId: bigint }[] };

@Injectable()
export class EnquetesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly similarityService: EnquetesSimilarityService,
  ) {}

  async findAll(usuario: AuthenticatedUser | null, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const enquetes = await this.prisma.enquete.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        usuario: true,
        opcoes: true,
        votos: usuario
          ? {
              where: { usuarioId: BigInt(usuario.id) },
              select: { opcaoId: true },
            }
          : false,
      },
    });

    return enquetes.map((enquete) => this.toResponse(enquete as EnqueteCompleta));
  }

  async findMine(usuario: AuthenticatedUser) {
    const enquetes = await this.prisma.enquete.findMany({
      where: { usuarioId: BigInt(usuario.id) },
      include: {
        usuario: true,
        opcoes: true,
        votos: {
          where: { usuarioId: BigInt(usuario.id) },
          select: { opcaoId: true },
        },
      },
    });

    return enquetes.map((enquete) => this.toResponse(enquete as EnqueteCompleta));
  }

  async findOne(id: number, usuario: AuthenticatedUser | null) {
    const enquete = await this.prisma.enquete.findUnique({
      where: { id: BigInt(id) },
      include: {
        usuario: true,
        opcoes: true,
        votos: usuario
          ? {
              where: { usuarioId: BigInt(usuario.id) },
              select: { opcaoId: true },
            }
          : false,
      },
    });

    if (!enquete) {
      throw new NotFoundException('Poll not found.');
    }

    return this.toResponse(enquete as EnqueteCompleta);
  }

  async close(id: number, usuario: AuthenticatedUser) {
    const enquete = await this.assertOwnedPoll(id, usuario.id);

    const now = new Date();
    const updated = await this.prisma.enquete.update({
      where: { id: enquete.id },
      data: { expirationDate: now, updatedAt: now },
      include: { usuario: true, opcoes: true },
    });

    this.similarityService.removePoll(id);

    return this.toResponse(updated as EnqueteCompleta);
  }

  async remove(id: number, usuario: AuthenticatedUser) {
    const enquete = await this.assertOwnedPoll(id, usuario.id);
    await this.prisma.enquete.delete({ where: { id: enquete.id } });
    this.similarityService.removePoll(id);
  }

  async update(id: number, usuario: AuthenticatedUser, body: UpdateEnqueteDto) {
    const enquete = await this.assertOwnedPoll(id, usuario.id);

    const voteCount = await this.prisma.voto.count({
      where: { enqueteId: enquete.id },
    });

    if (voteCount > 0) {
      throw new ConflictException('Poll already has votes and cannot be edited.');
    }

    const allowMultiple =
      body.allowMultiple !== undefined
        ? body.allowMultiple
        : enquete.allowMultiple;
    let maxChoices: number | null | undefined;
    if (body.maxChoices !== undefined) {
      maxChoices = body.maxChoices;
    } else {
      maxChoices = enquete.maxChoices;
    }

    if (maxChoices !== null && maxChoices !== undefined) {
      if (!allowMultiple) {
        throw new BadRequestException(
          'maxChoices can only be set when allowMultiple is true.',
        );
      }
      if (maxChoices > body.options.length) {
        throw new BadRequestException(
          'maxChoices cannot exceed the number of options.',
        );
      }
      if (maxChoices < 2) {
        throw new BadRequestException('maxChoices must be at least 2.');
      }
    }

    if (!allowMultiple) {
      maxChoices = null;
    }

    const now = new Date();
    const updateData: {
      title: string;
      updatedAt: Date;
      voteRequireLogin?: boolean;
      expirationDate?: Date;
      allowMultiple?: boolean;
      maxChoices?: number | null;
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

    if (body.allowMultiple !== undefined || body.maxChoices !== undefined) {
      updateData.allowMultiple = allowMultiple;
      updateData.maxChoices = maxChoices;
    }

    const result = await this.prisma.$transaction(async (transaction) => {
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

      return this.toResponse(updated as EnqueteCompleta);
    });

    this.similarityService.upsertPoll({
      id: result.id,
      title: result.title,
      options: body.options,
      votesCount: 0,
    });

    return result;
  }

  private async assertOwnedPoll(id: number, userId: number) {
    const enquete = await this.prisma.enquete.findUnique({
      where: { id: BigInt(id) },
      include: { usuario: true, opcoes: true },
    });

    if (!enquete) {
      throw new NotFoundException('Poll not found.');
    }

    if (enquete.usuarioId !== BigInt(userId)) {
      throw new ForbiddenException('You do not own this poll.');
    }

    return enquete;
  }

  async create(body: CreateEnqueteDto, usuario: AuthenticatedUser) {
    if (body.maxChoices !== undefined && body.maxChoices !== null) {
      if (!body.allowMultiple) {
        throw new BadRequestException(
          'maxChoices can only be set when allowMultiple is true.',
        );
      }
      if (body.maxChoices > body.options.length) {
        throw new BadRequestException(
          'maxChoices cannot exceed the number of options.',
        );
      }
      if (body.maxChoices < 2) {
        throw new BadRequestException('maxChoices must be at least 2.');
      }
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
        allowMultiple: body.allowMultiple ?? false,
        maxChoices: body.allowMultiple ? (body.maxChoices ?? null) : null,
        totalVoters: 0n,
        expirationDate,
        usuario: { connect: { id: BigInt(usuario.id) } },
        opcoes: {
          create: body.options.map((name) => ({ name, votes: 0n })),
        },
      },
      include: { usuario: true, opcoes: true },
    });

    const pollId = toSafeNumber(enquete.id);
    this.similarityService.upsertPoll({
      id: pollId,
      title: enquete.title,
      options: body.options,
      votesCount: 0,
    });

    return {
      id: pollId,
      title: enquete.title,
      createdAt: enquete.createdAt,
      updatedAt: enquete.updatedAt,
      voteRequireLogin: enquete.voteRequireLogin,
      allowMultiple: enquete.allowMultiple,
      maxChoices: enquete.maxChoices,
      totalVoters: toSafeNumber(enquete.totalVoters),
      expirationDate: enquete.expirationDate,
      user: {
        id: usuario.id,
        name: usuario.name,
      },
      options: this.options(enquete as EnqueteCompleta),
    };
  }

  async vote(body: CreateVotoDto, usuario: AuthenticatedUser | null) {
    const uniqueOptionIds = new Set(body.optionIds);
    if (uniqueOptionIds.size !== body.optionIds.length) {
      throw new BadRequestException('Duplicate option IDs are not allowed.');
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeVoteTransaction(body, usuario);
      } catch (error: any) {
        if (error?.code === 'P2034' && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 20 * attempt));
          continue;
        }
        throw error;
      }
    }
  }

  private async executeVoteTransaction(
    body: CreateVotoDto,
    usuario: AuthenticatedUser | null,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const pollId = BigInt(body.pollId);
      const optionIds = body.optionIds.map((id) => BigInt(id));
      const enquete = await transaction.enquete.findUnique({
        where: { id: pollId },
        include: { usuario: true, opcoes: true },
      });

      if (!enquete) {
        throw new BadRequestException('Poll not found.');
      }

      if (enquete.expirationDate <= new Date()) {
        throw new BadRequestException('Poll has expired.');
      }

      if (enquete.voteRequireLogin && !usuario) {
        throw new UnauthorizedException();
      }

      if (!enquete.allowMultiple && body.optionIds.length > 1) {
        throw new BadRequestException(
          'This poll does not allow multiple choices.',
        );
      }

      if (
        enquete.allowMultiple &&
        enquete.maxChoices &&
        body.optionIds.length > enquete.maxChoices
      ) {
        throw new BadRequestException(
          `You cannot select more than ${enquete.maxChoices} options.`,
        );
      }

      const pollOptionIdSet = new Set(enquete.opcoes.map((opt) => opt.id));
      const allBelong = optionIds.every((optId) => pollOptionIdSet.has(optId));
      if (!allBelong) {
        throw new BadRequestException('One or more options not found in poll.');
      }

      if (usuario) {
        const existingVoteCount = await transaction.voto.count({
          where: { enqueteId: pollId, usuarioId: BigInt(usuario.id) },
        });
        if (existingVoteCount > 0) {
          throw new ConflictException('User has already voted on this poll.');
        }
      }

      await transaction.enquete.update({
        where: { id: pollId },
        data: { totalVoters: { increment: 1 } },
      });

      const sortedOptionIds = [...optionIds].sort((a, b) =>
        a < b ? -1 : a > b ? 1 : 0,
      );
      await transaction.opcao.updateMany({
        where: { id: { in: sortedOptionIds }, enqueteId: pollId },
        data: { votes: { increment: 1 } },
      });

      const ballotId = randomUUID();
      await transaction.voto.createMany({
        data: optionIds.map((optId) => ({
          ballotId,
          enqueteId: pollId,
          opcaoId: optId,
          usuarioId: usuario ? BigInt(usuario.id) : null,
        })),
      });

      const result = await transaction.enquete.findUniqueOrThrow({
        where: { id: pollId },
        include: {
          usuario: true,
          opcoes: true,
          votos: usuario
            ? {
                where: { usuarioId: BigInt(usuario.id) },
                select: { opcaoId: true },
              }
            : false,
        },
      });

      this.similarityService.incrementVotesCount(
        toSafeNumber(pollId),
        body.optionIds.length,
      );

      return this.toResponse(result as EnqueteCompleta);
    });
  }

  private toResponse(enquete: EnqueteCompleta) {
    return {
      id: toSafeNumber(enquete.id),
      title: enquete.title,
      creatorName: enquete.usuario.name,
      expirationDate: enquete.expirationDate,
      voteRequireLogin: enquete.voteRequireLogin,
      allowMultiple: enquete.allowMultiple,
      maxChoices: enquete.maxChoices,
      totalVoters: toSafeNumber(enquete.totalVoters),
      options: this.options(enquete),
      hasVoted: Boolean(enquete.votos?.length),
      votedOptionIds:
        enquete.votos?.map((v) => toSafeNumber(v.opcaoId)) ?? [],
      votedOptionId: enquete.votos?.[0]
        ? toSafeNumber(enquete.votos[0].opcaoId)
        : null,
    };
  }

  private options(enquete: EnqueteCompleta) {
    return enquete.opcoes.map((opcao) => ({
      id: toSafeNumber(opcao.id),
      name: opcao.name,
      votes: toSafeNumber(opcao.votes),
    }));
  }
}
