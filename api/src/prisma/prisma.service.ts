import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

const databaseUrl = new URL(
  process.env.DATABASE_URL ??
    'mysql://will:will2009@localhost:3306/enqueteme',
);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaMariaDb({
        host: databaseUrl.hostname,
        port: Number(databaseUrl.port || 3306),
        user: decodeURIComponent(databaseUrl.username),
        password: decodeURIComponent(databaseUrl.password),
        database: decodeURIComponent(databaseUrl.pathname.slice(1)),
        timezone: 'Z',
      }),
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
