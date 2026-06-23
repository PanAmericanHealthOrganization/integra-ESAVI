import { BadRequestException, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata'; //primera línea necesaria para el modo depuración.
import { AppModule } from './app.module';

import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
dotenv.config();

// Configurar zona horaria de Ecuador (UTC-5)
process.env.TZ = 'America/Guayaquil';

async function bootstrap() {
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : true;

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY', 'X-Username'],
      credentials: true,
    },
  });
  const configService = app.get(ConfigService);
  const validationLogger = new Logger('ValidationPipe');
  app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((e) =>
          Object.values(e.constraints ?? {}).join(', ')
        );
        validationLogger.error(`Validation failed: ${JSON.stringify(messages)}`);
        return new BadRequestException(messages);
      },
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('API de Conexión ' + configService.get('NAME_PROYECT'))
    .setDescription(configService.get('DETAIL_PROYECT'))
    .setVersion(configService.get('VERSION'))
    .addServer(configService.get('HOST_SWAGGER'), configService.get('DETAIL_SWAGGER'))
    .setLicense('Todos los derechos reservados', '')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
        description: 'Ingresa tu API key entregada por essl personal de OPS/MSP',
      },
      'X-API-KEY',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT de Keycloak (Bearer)',
      },
      'keycloak-jwt',
    )
    .build();

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
  });
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(String(process.env.NAME_PROYECT), app, document);
  await app.listen(process.env.PORT_DEFAULT);

  console.log('HOST_SWAGGER', `${process.env.HOST_SWAGGER}/${String(process.env.NAME_PROYECT)}`);
  console.log('PORT:', process.env.PORT_DEFAULT);
}

bootstrap();
