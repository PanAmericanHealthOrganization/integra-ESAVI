import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class Icd10MeddraService {
  private readonly logger = new Logger(Icd10MeddraService.name);
  private readonly SIMILITUD_MINIMA = 0.9;

  constructor(
    @InjectDataSource('POSTGRES_INTEGRATOR_DS')
    private readonly dataSource: DataSource,
  ) {}

  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
  }

  private similitud(a: string, b: string): number {
    const s1 = a.toUpperCase();
    const s2 = b.toUpperCase();
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1;
    return (maxLen - this.levenshtein(s1, s2)) / maxLen;
  }

  async buscarCodigoLlt(nombre: string): Promise<string | null> {
    if (!nombre?.trim()) return null;
    const nombreNorm = nombre.trim().toUpperCase();

    // Búsqueda exacta en mayúsculas (caso más común)
    const exactos = await this.dataSource.query(
      `SELECT "MEDDRA_LLT_CODE", "MEDDRA_LLT"
       FROM "DHI_ESAVI"."TC_ICD10_MEDDRA"
       WHERE UPPER("MEDDRA_LLT") = $1
       LIMIT 1`,
      [nombreNorm],
    );

    if (exactos.length > 0) {
      this.logger.debug(`[buscarCodigoLlt] "${nombreNorm}" → coincidencia exacta: ${exactos[0].MEDDRA_LLT} (${exactos[0].MEDDRA_LLT_CODE})`);
      return exactos[0].MEDDRA_LLT_CODE;
    }

    // Sin coincidencia exacta: cargar candidatos con ILIKE y aplicar similitud Levenshtein
    const primeras3 = nombreNorm.substring(0, 3);
    const candidatos = await this.dataSource.query(
      `SELECT "MEDDRA_LLT_CODE", "MEDDRA_LLT"
       FROM "DHI_ESAVI"."TC_ICD10_MEDDRA"
       WHERE UPPER("MEDDRA_LLT") LIKE $1`,
      [`${primeras3}%`],
    );

    let mejorCodigo: string | null = null;
    let mejorSim = 0;
    for (const row of candidatos) {
      const sim = this.similitud(nombreNorm, (row.MEDDRA_LLT ?? '').toUpperCase());
      if (sim >= this.SIMILITUD_MINIMA && sim > mejorSim) {
        mejorSim = sim;
        mejorCodigo = row.MEDDRA_LLT_CODE;
      }
    }

    this.logger.debug(`[buscarCodigoLlt] "${nombreNorm}" → similitud: ${(mejorSim * 100).toFixed(1)}% — código: ${mejorCodigo ?? 'NINGUNO'}`);
    return mejorCodigo;
  }
}
