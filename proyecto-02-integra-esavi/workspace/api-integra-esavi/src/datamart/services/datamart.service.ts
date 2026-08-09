import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { existsSync } from 'fs';
import { SyncSource } from 'src/integrator/entity';
import { SyncService } from 'src/integrator/service/sync.service';
import {
  CONFIG_KEYS,
  DEFAULT_DATAMART_CRON,
  DatamartBuildResult,
  DatamartTrigger,
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
    private readonly syncService: SyncService,
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
    void this.regenerate('startup').catch((err) =>
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

  /**
   * Genera el datamart. Devuelve el resultado; si ya hay una generación en curso
   * no encola ni espera: devuelve un resultado marcado como `skipped`.
   */
  async regenerate(trigger: DatamartTrigger): Promise<DatamartBuildResult> {
    if (this.running) {
      this.logger.warn(
        `Regeneración (${trigger}) omitida: ya hay una en curso.`,
      );
      // Antes se devolvía `lastResult`, es decir el resultado de la generación
      // ANTERIOR, con su ok:true intacto: quien llamaba recibía "Datamart
      // regenerado correctamente" sin que se hubiera generado nada ni quedara
      // registro en TR_SYNC_PROCESS. Se devuelve un resultado propio, marcado
      // como omitido para distinguirlo de un fallo.
      const ahora = new Date().toISOString();
      return {
        ok: false,
        skipped: true,
        outputPath: this.builder.getOutputPath(),
        startedAt: ahora,
        finishedAt: ahora,
        durationMs: 0,
        rowCounts: {},
        error: 'Ya hay una regeneración del datamart en curso.',
      };
    }
    this.running = true;
    let result: DatamartBuildResult | undefined;
    try {
      // Cada generación queda registrada en TR_SYNC_PROCESS, igual que las
      // sincronizaciones de WHODrug y MedDRA.
      //
      // `build()` no lanza: captura el error y devuelve ok:false. Como
      // `ejecutarConRegistro` sólo marca FAILED cuando el proceso lanza, aquí se
      // relanza el error del build; el catch de abajo lo absorbe para conservar el
      // contrato de `regenerate` (devuelve el resultado, no lanza) del que dependen
      // el controller y el arranque.
      await this.syncService.ejecutarConRegistro(
        SyncSource.DATAMART,
        `Generación Datamart (${trigger})`,
        async () => {
          result = await this.builder.build();
          this.lastResult = result;
          if (!result.ok) {
            throw new Error(result.error ?? 'Fallo generando el datamart');
          }
          return {
            mensaje:
              `Datamart generado en ${result.outputPath} ` +
              `(${JSON.stringify(result.rowCounts)}) en ${result.durationMs} ms`,
            metadata: {
              trigger,
              outputPath: result.outputPath,
              rowCounts: result.rowCounts,
              durationMs: result.durationMs,
            },
          };
        },
        { metadata: { trigger } },
      );
    } catch (err: any) {
      // El registro ya quedó en FAILED. Si el build sí terminó, se devuelve su
      // resultado; si el fallo vino del propio registro (bitácora inaccesible), se
      // sintetiza uno para no romper a quien llama.
      this.logger.error(`Regeneración (${trigger}) falló: ${err?.message}`);
      result ??= {
        ok: false,
        outputPath: this.builder.getOutputPath(),
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 0,
        rowCounts: {},
        error: err?.message ?? String(err),
      };
      this.lastResult = result;
    } finally {
      this.running = false;
    }
    return result;
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
