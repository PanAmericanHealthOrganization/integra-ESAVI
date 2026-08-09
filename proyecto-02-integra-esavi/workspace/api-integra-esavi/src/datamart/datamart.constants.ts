/**
 * Constantes y configuración del módulo datamart.
 *
 * El módulo genera un único archivo DuckDB (`esavi.duckdb`) con las tablas ya
 * procesadas que consume el dashboard (dash-integra-esavi), reemplazando el
 * pipeline de archivos RDS (preparar_datos.R + procesamiento_datos.R).
 */

/** Nombre por defecto del cron diario (02:00, tras los integradores de la 1 AM). */
export const DEFAULT_DATAMART_CRON = '0 2 * * *';

/** Ruta de salida por defecto del archivo DuckDB (relativa al cwd del API). */
export const DEFAULT_DUCKDB_PATH = 'datos/esavi.duckdb';

/**
 * Claves de configuración (env) que consume el módulo.
 * Reutiliza las mismas credenciales Postgres que el resto del API.
 */
export const CONFIG_KEYS = {
  host: 'HOST_DATABASE',
  port: 'PORT_DATABASE',
  user: 'USER_DATABASE',
  pass: 'PASS_DATABASE',
  name: 'NAME_DATABASE',
  schema: 'SCHEMA_DATABASE',
  duckdbPath: 'DATAMART_DUCKDB_PATH',
  tmpDir: 'DATAMART_TMP_DIR',
  cron: 'DATAMART_CRON',
  enabled: 'DATAMART_CRON_ENABLED',
} as const;

/**
 * Qué originó una generación. Se registra en TR_SYNC_PROCESS para poder
 * distinguir en el historial una corrida manual de la programada o la que se
 * dispara al arrancar cuando falta el archivo.
 */
export type DatamartTrigger = 'cron' | 'on-demand' | 'startup';

/** Resultado de una generación del datamart. */
export interface DatamartBuildResult {
  ok: boolean;
  outputPath: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  rowCounts: Record<string, number>;
  error?: string;
  /**
   * La generación no llegó a ejecutarse porque ya había otra en curso. Se
   * distingue de un fallo: no hay nada roto, pero tampoco se generó nada nuevo
   * ni quedó registro en TR_SYNC_PROCESS.
   */
  skipped?: boolean;
}
