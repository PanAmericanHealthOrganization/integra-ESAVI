import { DuckDBInstance } from '@duckdb/node-api';
import { buildTransformStatements } from 'src/datamart/sql/datamart-sql';

/**
 * Contrato de estructura del datamart.
 *
 * Las sentencias 1.x extraen de Postgres (alias `pg`) y aquí no hay Postgres, así
 * que se sustituyen por tablas `raw_*` de mentira con EXACTAMENTE las columnas que
 * esas sentencias producen. El resto del pipeline (macros + pasos 2.x, 3.x, 4)
 * corre tal cual contra DuckDB en memoria.
 *
 * Con eso, cualquier columna que se caiga a mitad del pipeline (p. ej. una que las
 * CTE arrastran pero la proyección final de `dim_report` no lista) revienta aquí
 * con el mismo Binder Error que en producción, en vez de en la regeneración real.
 */

/** Columnas que las sentencias 1.x publican; los stubs deben calcar esta forma. */
const RAW_STUBS: Record<string, string> = {
  raw_patient: `SELECT '1'::VARCHAR AS id, '1' AS sexo, CAST(NULL AS VARCHAR) AS etnia,
                       DATE '1990-05-04' AS fechanac
                UNION ALL
                SELECT '2', '2', NULL, DATE '2019-01-20'`,
  raw_report: `SELECT '10'::VARCHAR AS id, '1'::VARCHAR AS patient_id, 'CASE-10' AS caseid,
                      'ECU' AS pais_iso, 34 AS edadinicreg, '1' AS unidadedad,
                      '170150' AS geonoti, 'Declarada' AS origen_residencia,
                      DATE '2026-03-10' AS fechanot
               UNION ALL
               SELECT '11', '2', 'CASE-11', 'ECU', 8, '2', '090150', 'Sin info', DATE '2026-04-02'`,
  raw_event: `SELECT '100'::VARCHAR AS id, '10'::VARCHAR AS report_id,
                     '10019211'::VARCHAR AS codmeddraesavip, DATE '2026-03-08' AS fecinesavi
              UNION ALL
              SELECT '101', '11', '10037660', DATE '2026-04-01'`,
  raw_vaccine: `SELECT '200'::VARCHAR AS id, '10'::VARCHAR AS report_id,
                       'Laboratorio X' AS nomfabri, 'VACUNA ALFA' AS nomcomv,
                       'lote-a1' AS numlote, '1' AS dosis, DATE '2026-03-01' AS fvacunac
                UNION ALL
                SELECT '201', '11', 'Laboratorio Y', 'VACUNA BETA', 'lote-b2', '2', DATE '2026-03-28'`,
  raw_soutcome: `SELECT '300'::VARCHAR AS id, '10'::VARCHAR AS report_id,
                        5 AS desenesv, 0 AS mueresav, 1 AS gravesav
                 UNION ALL
                 SELECT '301', '11', 1, 0, 0`,
  raw_pregnancy: `SELECT '400'::VARCHAR AS id, '10'::VARCHAR AS report_id, 2 AS embesavi
                  UNION ALL
                  SELECT '401', '11', 3`,
  raw_dosis: `SELECT DATE '2026-03-05' AS fecha_sem_epi, '3' AS grupo_etario,
                     'Hombre' AS sexo, 120 AS "NumDosis"
              UNION ALL
              SELECT DATE '2026-03-05', '3', 'Mujer', 98`,
  ref_meddra: `SELECT '10019211'::VARCHAR AS llt_code, 'Cefalea' AS pt,
                      'Sin HLT asociado' AS hlt, 'Sin HLGT asociado' AS hlgt,
                      'Trastornos del sistema nervioso' AS soc, 'Sin SMQ asociado' AS smq
               UNION ALL
               SELECT '10037660', 'Fiebre', 'Sin HLT asociado', 'Sin HLGT asociado',
                      'Trastornos generales', 'Sin SMQ asociado'`,
};

/** Columnas que el dashboard consume de `datos_procesados`. */
const COLUMNAS_DATOS_PROCESADOS = [
  'report_id', 'caseid', 'fechanot', 'añoNoti', 'mesNoti', 'periodoNoti', 'semEpiNoti',
  'edad', 'grupo_etario', 'grupo_etario_menores', 'grupo_etario_hcue', 'sexo', 'geo_pais',
  'pais_iso', 'geonoti', 'origen_residencia', 'desenesv', 'marca_grave', 'marca_menores',
  'marca_embarazo', 'marca_muerte', 'fvacunac', 'fecinesavi', 'dias_vac_ini_cat',
  'dias_vac_ini', 'id_event_smq', 'event_id', 'pt', 'hlt', 'hlgt', 'soc', 'smq',
  'vaccine_id', 'nomcomv', 'nomfabri', 'dosis', 'numlote',
  'numeroNotificacao', 'dataNotificacao', 'id_vaccine', 'doseImunobiologico',
];

/** Columnas que el dashboard consume de `dosis_admin` (vacunómetro). */
const COLUMNAS_DOSIS_ADMIN = [
  'fecha_sem_epi', 'semEpiNoti', 'sexo', 'grupo_etario', 'grupo_etario_hcue',
  'NumDosis', 'añoNoti', 'mesNoti', 'periodoNoti',
];

describe('datamart-sql — contrato de estructura de tablas', () => {
  let instance: Awaited<ReturnType<typeof DuckDBInstance.create>>;
  let conn: Awaited<ReturnType<typeof instance.connect>>;

  const columnasDe = async (tabla: string): Promise<string[]> => {
    const reader = await conn.runAndReadAll(
      `SELECT column_name FROM duckdb_columns() WHERE table_name = '${tabla}' ORDER BY column_index`,
    );
    return reader.getRowObjects().map((r: any) => String(r.column_name));
  };

  beforeAll(async () => {
    instance = await DuckDBInstance.create(':memory:');
    conn = await instance.connect();

    for (const [tabla, select] of Object.entries(RAW_STUBS)) {
      await conn.run(`CREATE OR REPLACE TABLE ${tabla} AS ${select}`);
    }

    // Se saltan las sentencias 1.x: son las únicas que tocan el Postgres adjunto.
    const statements = buildTransformStatements({ schema: 'DHI_ESAVI' }).filter(
      (sql) => !sql.includes('pg."'),
    );
    expect(statements.length).toBeGreaterThan(0);

    for (const sql of statements) {
      await conn.run(sql);
    }
  }, 60_000);

  afterAll(() => {
    conn?.disconnectSync();
    instance?.closeSync();
  });

  it('las sentencias 1.x son las únicas que dependen de Postgres', () => {
    const dependenPg = buildTransformStatements({ schema: 'DHI_ESAVI' }).filter((sql) =>
      sql.includes('pg."'),
    );
    // 8 extracciones crudas: patient, report, event, vaccine, soutcome, pregnancy, meddra, dosis.
    expect(dependenPg).toHaveLength(8);
    // Cada stub de este test corresponde a una de ellas.
    expect(Object.keys(RAW_STUBS)).toHaveLength(8);
  });

  it('datos_procesados expone exactamente las columnas del contrato', async () => {
    expect(await columnasDe('datos_procesados')).toEqual(COLUMNAS_DATOS_PROCESADOS);
  });

  it('dosis_admin expone exactamente las columnas del contrato', async () => {
    expect(await columnasDe('dosis_admin')).toEqual(COLUMNAS_DOSIS_ADMIN);
  });

  it('origen_residencia sobrevive de raw_report hasta datos_procesados', async () => {
    const reader = await conn.runAndReadAll(
      `SELECT report_id, origen_residencia FROM datos_procesados ORDER BY report_id`,
    );
    expect(reader.getRowObjects()).toEqual([
      { report_id: '10', origen_residencia: 'Declarada' },
      { report_id: '11', origen_residencia: 'Sin info' },
    ]);
  });

  it('_meta reporta el conteo de las dos tablas finales', async () => {
    const reader = await conn.runAndReadAll(`SELECT tabla, filas FROM _meta ORDER BY tabla`);
    const filas = reader.getRowObjects().map((r: any) => ({
      tabla: String(r.tabla),
      filas: Number(r.filas),
    }));
    expect(filas).toEqual([
      { tabla: 'datos_procesados', filas: 2 },
      { tabla: 'dosis_admin', filas: 2 },
    ]);
  });

  it('las tablas intermedias se eliminan al final', async () => {
    const reader = await conn.runAndReadAll(
      `SELECT table_name FROM duckdb_tables() ORDER BY table_name`,
    );
    const tablas = reader.getRowObjects().map((r: any) => String(r.table_name));
    expect(tablas).toEqual(['_meta', 'datos_procesados', 'dosis_admin']);
  });
});
