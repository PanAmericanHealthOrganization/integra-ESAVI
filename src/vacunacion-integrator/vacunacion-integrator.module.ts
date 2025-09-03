import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegratorModule } from 'src/integrator/integrator.module';
import { VacunacionNominal } from './entity/vacunacion';
import { VacunacionService } from './service/vacunacion.service';
import { VacunacionSyncController } from './controllers/vacunacion.sync';

// Nombre de la conexión Oracle
export const ORACLE_VACUNACION_DS = 'ORACLE_VACUNACION_DS';

@Module({})
export class VacunacionIntegratorModule {
  static forRoot(): DynamicModule {
    return {
      module: VacunacionIntegratorModule,
      imports: [
        IntegratorModule,
        ConfigModule,

        TypeOrmModule.forRoot({
          type: 'oracle',
          host: process.env.DB_VACUNACION_DB_HOST,
          port: Number(process.env.DB_VACUNACION_DB_PORT),
          username: process.env.DB_VACUNACION_DB_USER,
          password: process.env.DB_VACUNACION_DB_PASS,
          database: process.env.DB_VACUNACION_DB_NAME,
          schema: process.env.DB_VACUNACION_DB_SCHEMA,
          entities: [VacunacionNominal],
          retryDelay: Number(process.env.RETRYDELAY_DATABASE),
          retryAttempts: Number(process.env.RETRYATTEMPTS_DATABASE),
          synchronize: true,
        }),
        TypeOrmModule.forFeature([VacunacionNominal]),
      ],
      controllers: [VacunacionSyncController],
      providers: [VacunacionService],
      exports: [VacunacionService],
    };
  }
}
