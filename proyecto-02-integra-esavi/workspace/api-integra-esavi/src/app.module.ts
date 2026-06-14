import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import 'reflect-metadata';
import { Dhis2IntegratorModule } from './dhis2-integrator/dhis2-integrator.module';
import { HealthModule } from './health/health.module';
import { HomologatorModule } from './homologator/homologator.module';
import { IntegratorModule } from './integrator/integrator.module';
import { MeddraModule } from './meddra/meddra.module';
import { DataqualityModule } from './dataquality/dataquality.module';
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
    HealthModule,
    Dhis2IntegratorModule,
    //VacunacionIntegratorModule, // Temporarily disabled. Enable when update the ORACLE DATABASE credentials.
    VigiflowIntegratorModule,
    WhodrugsModule,
    MeddraModule,
    DataqualityModule,
    HomologatorModule,
  ],
  providers: [],
})
export class AppModule {}
