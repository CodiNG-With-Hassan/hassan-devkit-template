import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { AppValidationPipe } from './common/pipes/app-validation.pipe';
import { ErrorResponse } from './common/dto/error-response.dto';

async function bootstrap() {
  // Pre-synchronize SQL steps (ADR 0001) are awaited here, before the app is
  // created, e.g. `await runRenameFooToBarMigration();` — see
  // src/migrations/run-sql-before-synchronize.ts.

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Allow class-validator to resolve injectable validators via Nest DI.
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Every route lives under /api. Swagger is unaffected: the UI stays at
  // /api and the spec at /api-json.
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || [],
    credentials: true,
  });

  // Raises every class-validator failure as VALIDATION_FAILED (ADR 0002).
  app.useGlobalPipes(new AppValidationPipe());

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('Template API')
    .setDescription('The API of the template project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  // ErrorResponse is the body of every 4xx/5xx (ADR 0002). Registering it as
  // an extra model keeps it — and the named ErrorCode enum the frontends
  // generate their const from — in the spec even while no endpoint declares
  // an error response yet.
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorResponse],
  });
  // Stamp the doc with this stack's identity (set by docker-compose.dev.yml)
  // so fetch-spec.mjs can refuse a spec served by another worktree's stack.
  // The stamps are stripped before the spec is written to disk.
  if (process.env.DEVKIT_STACK) {
    Object.assign(document.info, {
      'x-devkit-stack': process.env.DEVKIT_STACK,
    });
  }
  if (process.env.DEVKIT_BRANCH) {
    Object.assign(document.info, {
      'x-devkit-branch': process.env.DEVKIT_BRANCH,
    });
  }
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
