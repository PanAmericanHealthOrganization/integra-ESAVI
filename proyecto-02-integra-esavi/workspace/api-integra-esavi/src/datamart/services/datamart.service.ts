import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { existsSync } from 'fs';
import {
  CONFIG_KEYS,
  DEFAULT_DATAMART_CRON,
  DatamartBuildResult,
} from '../datamart.constants';
import { DuckDbBuilderService } from './duckdb-builder.service';

/**
 * Orquesta la generación del datamart DuckDB:
 *  - Cron diario (configurable vía DATAMART_CRON, por defecto 02:00).
 *  - Bajo demanda vía DatamartController.
 * Un lock en memoria evita ejecuciones solapadas (cron + on-demand).
 */
@Injectable()
export class DatamartService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatamartService.name);
  private running = false;
  private lastResult?: DatamartBuildResult;

  constructor(
    private readonly config: ConfigService,
    private readonly builder: DuckDbBuilderService,
  ) {}

  /**
   * Al arrancar la app, si el archivo DuckDB no existe (primer despliegue),
   * lo genera para que el dashboard tenga datos. No bloquea el arranque:
   * se ejecuta en segundo plano y sólo se registra el resultado.
   * Desactivable con DATAMART_BUILD_ON_STARTUP=false.
   */
  onApplicationBootstrap(): void {
    const enabled =
      (this.config.get<string>('DATAMART_BUILD_ON_STARTUP') ?? 'true') !==
      'false';
    if (!enabled) return;
    const outputPath = this.builder.getOutputPath();
    if (existsSync(outputPath)) {
      this.logger.log(
        `Datamart ya existe (${outputPath}); no se genera al arranque.`,
      );
      return;
    }
    this.logger.log(
      'Datamart no existe: generando en segundo plano al arranque...',
    );
    void this.regenerate('on-demand').catch((err) =>
      this.logger.error(`Generación de arranque falló: ${err?.message}`),
    );
  }

  /** Cron diario. Se puede desactivar con DATAMART_CRON_ENABLED=false. */
  @Cron(process.env[CONFIG_KEYS.cron] || DEFAULT_DATAMART_CRON, {
    name: 'datamart-regenerate',
  })
  async scheduledBuild(): Promise<void> {
    const enabled =
      (this.config.get<string>(CONFIG_KEYS.enabled) ?? 'true') !== 'false';
    if (!enabled) {
      this.logger.log('Cron datamart desactivado (DATAMART_CRON_ENABLED=false).');
      return;
    }
    this.logger.log('Cron datamart: iniciando regeneración programada.');
    await this.regenerate('cron');
  }

  /** Genera el datamart. Devuelve el resultado; ignora si ya hay uno en curso. */
  async regenerate(trigger: 'cron' | 'on-demand'): Promise<DatamartBuildResult> {
    if (this.running) {
      this.logger.warn(
        `Regeneración (${trigger}) omitida: ya hay una en curso.`,
      );
      return (
        this.lastResult ?? {
          ok: false,
          outputPath: this.builder.getOutputPath(),
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          durationMs: 0,
          rowCounts: {},
          error: 'Ya hay una regeneración en curso.',
        }
      );
    }
    this.running = true;
    try {
      const result = await this.builder.build();
      this.lastResult = result;
      return result;
    } finally {
      this.running = false;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  getStatus(): { running: boolean; last?: DatamartBuildResult; outputPath: string } {
    return {
      running: this.running,
      last: this.lastResult,
      outputPath: this.builder.getOutputPath(),
    };
  }
}
