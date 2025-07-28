import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  

  console.log('HOST_DATABASE:::: ', process.env.HOST_DATABASE);
  console.log('NAME_DATABASE:::: ', process.env.NAME_DATABASE);
  console.log('SCHEMA_DATABASE:::: ', process.env.SCHEMA_DATABASE);
  console.log('PORT_DATABASE:::: ', process.env.PORT_DATABASE);
  console.log('USER_DATABASE:::: ', process.env.USER_DATABASE);
  console.log('PASS_DATABASE:::: ', process.env.PASS_DATABASE);


  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(new ValidationPipe());
  const config = new DocumentBuilder()
    .setTitle('API de Conexión ' + process.env.NAME_PROYECT)
    .setDescription(process.env.DETAIL_PROYECT)
    .setVersion(process.env.VERSION)
    .addServer(process.env.HOST_SWAGGER, process.env.DETAIL_SWAGGER)
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
  const document = SwaggerModule.createDocument(app, config);
  
  
  SwaggerModule.setup(String(process.env.NAME_PROYECT), app, document);
  await app.listen(process.env.PORT_DEFAULT);

  console.log('HOST_SWAGGER', `${process.env.HOST_SWAGGER}/${String(process.env.NAME_PROYECT)}`);
  console.log('PORT:', process.env.PORT_DEFAULT);
  
}

bootstrap();
