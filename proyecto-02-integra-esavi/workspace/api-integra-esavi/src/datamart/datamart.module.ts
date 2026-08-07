import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntegratorModule } from 'src/integrator/integrator.module';
import { DatamartController } from './controllers/datamart.controller';
import { DatamartService } from './services/datamart.service';
import { DuckDbBuilderService } from './services/duckdb-builder.service';

/**
 * Módulo datamart: genera un único archivo DuckDB con las tablas ya procesadas
 * (datos_procesados, dosis_admin) para el dashboard, reemplazando los RDS.
 *
 * No usa TypeORM: la extracción se hace vía la extensión `postgres` de DuckDB,
 * reutilizando las credenciales del API (ConfigService).
 *
 * No importa ScheduleModule.forRoot(): en este proyecto el scheduler se registra
 * una sola vez (WhodrugsModule) y el @Cron de DatamartService lo descubre el
 * explorer global (mismo patrón que DataqualityModule/VigiflowIntegratorModule).
 *
 * Importa IntegratorModule sólo por SyncService: cada generación se registra en
 * TR_SYNC_PROCESS, igual que las sincronizaciones de WHODrug y MedDRA.
 */
@Module({
  imports: [ConfigModule, IntegratorModule],
  controllers: [DatamartController],
  providers: [DatamartService, DuckDbBuilderService],
  exports: [DatamartService],
})
export class DatamartModule {}
