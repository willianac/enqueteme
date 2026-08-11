import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.listen(Number(process.env.PORT ?? 8080));
}

void bootstrap();
