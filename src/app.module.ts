import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import 'reflect-metadata';
import { Dhis2IntegratorModule } from './dhis2-integrator/dhis2-integrator.module';
import { IntegratorModule } from './integrator/integrator.module';
import { MeddraModule } from './meddra/meddra.module';
import { HttpExceptionFilter } from './providers/http-exception.filter';
import { HeaderApiKeyStrategy } from './strategy/header-api-key.strategy';
import { VacunacionIntegratorModule } from './vacunacion-integrator/vacunacion-integrator.module';
import { VigiflowIntegratorModule } from './vigiflow-integrator/vigiflow-integrator.module';
import { WhodrugsModule } from './whodrugs/whodrugs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    IntegratorModule,
    Dhis2IntegratorModule,
    VacunacionIntegratorModule,
    VigiflowIntegratorModule,
    WhodrugsModule,
    MeddraModule,
  ],
  providers: [
    HeaderApiKeyStrategy,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
