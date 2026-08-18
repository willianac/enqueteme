import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toSafeNumber } from '../prisma/to-safe-number';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const SESSION_COOKIE = 'enqueteme_session';
export const SESSION_MAX_AGE = SESSION_TTL_MS;

export type GoogleProfile = {
  subject: string;
  email: string;
  name: string;
};

export type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(profile: GoogleProfile) {
    const now = new Date();
    await this.prisma.sessao.deleteMany({
      where: { expiresAt: { lte: now } },
    });

    const usuario = await this.prisma.usuario.upsert({
      where: { googleSubject: profile.subject },
      update: { email: profile.email, name: profile.name },
      create: {
        googleSubject: profile.subject,
        email: profile.email,
        name: profile.name,
      },
    });
    const token = randomBytes(32).toString('base64url');

    await this.prisma.sessao.create({
      data: {
        tokenHash: this.hash(token),
        expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
        usuarioId: usuario.id,
      },
    });

    return { token, user: this.toResponse(usuario) };
  }

  async resolveSession(token?: string): Promise<AuthenticatedUser | null> {
    if (!token) {
      return null;
    }

    const sessao = await this.prisma.sessao.findUnique({
      where: { tokenHash: this.hash(token) },
      include: { usuario: true },
    });

    if (!sessao) {
      return null;
    }

    if (sessao.expiresAt <= new Date()) {
      await this.prisma.sessao.delete({
        where: { tokenHash: sessao.tokenHash },
      });
      return null;
    }

    return this.toResponse(sessao.usuario);
  }

  async deleteSession(token?: string) {
    if (token) {
      await this.prisma.sessao.deleteMany({
        where: { tokenHash: this.hash(token) },
      });
    }
  }

  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private toResponse(usuario: { id: bigint; name: string; email: string }) {
    return {
      id: toSafeNumber(usuario.id),
      name: usuario.name,
      email: usuario.email,
    };
  }
}
