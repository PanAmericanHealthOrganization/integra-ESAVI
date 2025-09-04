import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegratorModule } from 'src/integrator/integrator.module';
import { VacunacionNominalSyncController } from './controllers/vacunacion-nominal-sync.controller';
import { VacunacionNominal } from './entity/vacunacion.entity';
import { VacunacionNominalService } from './service/vacunacion-nominal.service';

// Nombre de la conexión Oracle
export const ORACLE_VACUNACION_DS = 'ORACLE_VACUNACION_DS';

@Module({
  imports: [
    ConfigModule,
    IntegratorModule,
    TypeOrmModule.forRootAsync({
      name: ORACLE_VACUNACION_DS,
      useFactory: (configService: ConfigService) => ({
        name: ORACLE_VACUNACION_DS,
        type: 'oracle',
        host: configService.get('DB_VACUNACION_DB_HOST'),
        port: +configService.get('DB_VACUNACION_DB_PORT'),
        username: configService.get('DB_VACUNACION_DB_USER'),
        password: configService.get('DB_VACUNACION_DB_PASS'),
        serviceName: configService.get('DB_VACUNACION_DB_NAME'),
        entities: [VacunacionNominal],
        synchronize: false,
        poolSize: 5,
      }),
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([VacunacionNominal], ORACLE_VACUNACION_DS),
  ],
  providers: [VacunacionNominalService],
  controllers: [VacunacionNominalSyncController],
})
export class VacunacionIntegratorModule {}
