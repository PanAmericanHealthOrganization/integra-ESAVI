import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
import { promises as fs } from 'fs';
import * as path from 'path';
import {
  CONFIG_KEYS,
  DEFAULT_DUCKDB_PATH,
  DatamartBuildResult,
} from '../datamart.constants';
import { buildTransformStatements } from '../sql/datamart-sql';

/**
 * Motor de construcción del archivo DuckDB.
 *
 * Estrategia:
 *  1. Crea un archivo temporal en el MISMO directorio del destino (mismo FS).
 *  2. Adjunta Postgres (READ_ONLY) vía extensión `postgres`.
 *  3. Ejecuta los pasos SQL de extracción + transformación.
 *  4. Cierra la conexión y renombra el temporal sobre el destino (swap atómico),
 *     de modo que el dashboard nunca lea un archivo a medio escribir.
 */
@Injectable()
export class DuckDbBuilderService {
  private readonly logger = new Logger(DuckDbBuilderService.name);

  constructor(private readonly config: ConfigService) {}

  /** Ruta absoluta del archivo DuckDB de salida. */
  getOutputPath(): string {
    const configured =
      this.config.get<string>(CONFIG_KEYS.duckdbPath) || DEFAULT_DUCKDB_PATH;
    return path.resolve(configured);
  }

  /** Construye el archivo DuckDB completo y lo publica de forma atómica. */
  async build(): Promise<DatamartBuildResult> {
    const startedAt = new Date();
    const outputPath = this.getOutputPath();
    const tmpDir =
      this.config.get<string>(CONFIG_KEYS.tmpDir) || path.dirname(outputPath);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.mkdir(tmpDir, { recursive: true });

    const tmpPath = path.join(
      tmpDir,
      `.esavi-${startedAt.getTime()}-${process.pid}.duckdb.tmp`,
    );
    await this.safeUnlink(tmpPath);

    let rowCounts: Record<string, number> = {};
    let instance: DuckDBInstance | undefined;
    let conn: DuckDBConnection | undefined;

    try {
      instance = await DuckDBInstance.create(tmpPath);
      conn = await instance.connect();

      await this.loadPostgresExtension(conn);
      await this.attachPostgres(conn);

      const schema =
        this.config.get<string>(CONFIG_KEYS.schema) || 'DHI_ESAVI';
      const statements = buildTransformStatements({ schema });

      let i = 0;
      for (const sql of statements) {
        i += 1;
        await conn.run(sql);
      }
      this.logger.log(`Ejecutados ${i} pasos SQL de transformación.`);

      await conn.run('DETACH pg');
      rowCounts = await this.readRowCounts(conn);

      // Cerrar antes del swap para liberar el archivo.
      conn.disconnectSync();
      conn = undefined;
      instance?.closeSync?.();
      instance = undefined;

      await fs.rename(tmpPath, outputPath);

      const finishedAt = new Date();
      this.logger.log(
        `DuckDB generado en ${outputPath} (${JSON.stringify(rowCounts)}) en ${
          finishedAt.getTime() - startedAt.getTime()
        } ms`,
      );
      return {
        ok: true,
        outputPath,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        rowCounts,
      };
    } catch (err: any) {
      this.logger.error(`Fallo generando DuckDB: ${err?.message}`, err?.stack);
      try {
        conn?.disconnectSync();
      } catch {
        /* noop */
      }
      try {
        instance?.closeSync?.();
      } catch {
        /* noop */
      }
      await this.safeUnlink(tmpPath);
      const finishedAt = new Date();
      return {
        ok: false,
        outputPath,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        rowCounts,
        error: err?.message ?? String(err),
      };
    }
  }

  /** Carga la extensión postgres (INSTALL puede requerir red la 1ra vez). */
  private async loadPostgresExtension(conn: DuckDBConnection): Promise<void> {
    try {
      await conn.run('INSTALL postgres');
    } catch (err: any) {
      // Si ya está instalada (o sin red pero cacheada), continuar con LOAD.
      this.logger.warn(
        `INSTALL postgres no completó (se intentará LOAD): ${err?.message}`,
      );
    }
    await conn.run('LOAD postgres');
  }

  /** Adjunta la BD Postgres en modo solo lectura. No registra la contraseña. */
  private async attachPostgres(conn: DuckDBConnection): Promise<void> {
    const dsn = this.buildLibpqDsn();
    // Escapar comillas simples para el literal SQL de DuckDB (doblándolas).
    const dsnSql = dsn.replace(/'/g, "''");
    await conn.run(`ATTACH '${dsnSql}' AS pg (TYPE postgres, READ_ONLY)`);
    this.logger.log('Postgres adjuntado (READ_ONLY) en DuckDB.');
  }

  /** Construye la cadena de conexión libpq a partir de la config del API. */
  private buildLibpqDsn(): string {
    const host = this.config.get<string>(CONFIG_KEYS.host) || 'localhost';
    const port = this.config.get<string>(CONFIG_KEYS.port) || '5432';
    const dbname = this.config.get<string>(CONFIG_KEYS.name) || 'DHI_ESAVI';
    const user = this.config.get<string>(CONFIG_KEYS.user) || '';
    const pass = this.config.get<string>(CONFIG_KEYS.pass) || '';
    const q = (v: string) => `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    return `host=${q(host)} port=${port} dbname=${q(dbname)} user=${q(
      user,
    )} password=${q(pass)}`;
  }

  /** Lee los conteos de la tabla _meta. */
  private async readRowCounts(
    conn: DuckDBConnection,
  ): Promise<Record<string, number>> {
    const reader = await conn.runAndReadAll(
      'SELECT tabla, filas FROM _meta ORDER BY tabla',
    );
    const out: Record<string, number> = {};
    for (const row of reader.getRowObjects()) {
      out[String(row.tabla)] = Number(row.filas);
    }
    return out;
  }

  private async safeUnlink(p: string): Promise<void> {
    try {
      await fs.unlink(p);
    } catch {
      /* no existe: noop */
    }
  }
}
