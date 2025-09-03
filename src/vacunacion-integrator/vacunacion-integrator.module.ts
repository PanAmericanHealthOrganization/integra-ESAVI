import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegratorModule } from 'src/integrator/integrator.module';
import { VacunacionNominalSyncController } from './controllers/vacunacion-nominal-sync.controller';
import { VacunacionNominal } from './entity/vacunacion';
import { VacunacionNominalService } from './service/vacunacion-nominal.service';

// Nombre de la conexión Oracle
export const ORACLE_VACUNACION_DS = 'ORACLE_VACUNACION_DS';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'oracle',
      host: process.env.DB_VACUNACION_DB_HOST,
      port: Number(process.env.DB_VACUNACION_DB_PORT),
      username: process.env.DB_VACUNACION_DB_USER,
      password: process.env.DB_VACUNACION_DB_PASS,
      schema: process.env.DB_VACUNACION_DB_SCHEMA,
      serviceName: process.env.DB_VACUNACION_DB_NAME,
      synchronize: true,
    }),
    TypeOrmModule.forFeature([VacunacionNominal], ORACLE_VACUNACION_DS),
    ScheduleModule.forRoot(),
    IntegratorModule,
  ],
  providers: [VacunacionNominalService],
  controllers: [VacunacionNominalSyncController],
})
export class VacunacionIntegratorModule {}
