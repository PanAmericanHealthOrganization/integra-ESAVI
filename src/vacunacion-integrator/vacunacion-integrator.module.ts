import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegratorModule } from 'src/integrator/integrator.module';
import { VacunacionNominal } from './entity/vacunacion';
import { VacunacionNominalSyncController } from './controllers/vacunacion.sync';
import { VacunacionNominalService } from './service/vacunacion-nominal.service';

// Nombre de la conexión Oracle
export const ORACLE_VACUNACION_DS = 'ORACLE_VACUNACION_DS';

@Module({
  //imports: [TypeOrmModule.forFeature([VacunacionNominal])],
  //providers: [VacunacionNominalService],
  //Scontrollers: [VacunacionNominalSyncController],
})
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
          schema: process.env.DB_VACUNACION_DB_SCHEMA,
          serviceName: process.env.DB_VACUNACION_DB_NAME,
          synchronize: true,
        }),
        TypeOrmModule.forFeature([VacunacionNominal]),
      ],
      controllers: [VacunacionNominalSyncController],
      providers: [VacunacionNominalService],
      exports: [VacunacionNominalService],
    };
  }
}
