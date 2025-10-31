import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const configService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe());
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
        description: 'Ingresa tu API key entregada por el personal de OPS/MSP',
      },
      'X-API-KEY',
    )
    .build();

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'V',
  });
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(String(process.env.NAME_PROYECT), app, document);
  await app.listen(process.env.PORT_DEFAULT);

  console.log('HOST_SWAGGER', `${process.env.HOST_SWAGGER}/${String(process.env.NAME_PROYECT)}`);
  console.log('PORT:', process.env.PORT_DEFAULT);
}

bootstrap();
