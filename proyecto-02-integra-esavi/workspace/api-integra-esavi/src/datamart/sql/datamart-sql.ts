/**
 * SQL del datamart ESAVI — portado desde dash-integra-esavi/scripts/procesamiento_datos.R
 * (y la extracción de preparar_datos.R).
 *
 * Todo corre DENTRO de DuckDB: se adjunta Postgres (READ_ONLY), se materializan
 * las tablas crudas, y luego una serie de pasos SQL producen las tablas finales
 * `datos_procesados` y `dosis_admin` — ya listas para el dashboard (sin que R
 * tenga que transformar nada).
 *
 * Decisiones registradas con el equipo:
 *  - MedDRA solo desde Postgres (LLT→PT→SOC v27). HLT/HLGT/SMQ no existen en la
 *    BD ⇒ quedan como "Sin ... asociado" (replica el fallback del R).
 *  - Bug corregido: las vacunas se unen por NOTIFICACION_ID (el R original usaba
 *    el id de vacunación, que nunca cruzaba con los reportes).
 *  - Semana epidemiológica calculada en SQL (aprox. MMWR/PAHO: semanas dom–sáb,
 *    ISO sobre la fecha +1 día). Punto a validar contra sem_epi.rds.
 *  - patients: se replica el dedup del R (unique por sexo/fechanac/etnia).
 */

export interface BuildSqlOptions {
  /** Esquema Postgres de datos ESAVI (p. ej. "DHI_ESAVI"). */
  schema: string;
  /** Alias de la BD Postgres adjunta en DuckDB. */
  pgAlias?: string;
}

/**
 * Devuelve la lista ordenada de sentencias SQL a ejecutar una por una.
 * NO incluye el ATTACH (que lleva credenciales y lo maneja el servicio).
 */
export function buildTransformStatements(opts: BuildSqlOptions): string[] {
  const alias = opts.pgAlias ?? 'pg';
  // Prefijo de tablas Postgres adjuntas, con esquema citado (case-sensitive).
  const S = `${alias}."${opts.schema}"`;

  return [
    // ---------------------------------------------------------------------
    // 0. Macros de apoyo
    // ---------------------------------------------------------------------
    // Title-case equivalente a tools::toTitleCase(tolower(iconv(x,'ASCII//TRANSLIT')))
    `CREATE OR REPLACE MACRO tc(s) AS (
       CASE WHEN s IS NULL THEN NULL ELSE
         array_to_string(
           list_transform(
             string_split(lower(strip_accents(CAST(s AS VARCHAR))), ' '),
             x -> CASE WHEN length(x) = 0 THEN x ELSE upper(x[1]) || x[2:] END
           ), ' ')
       END
     )`,
    // Abreviatura de mes en español (equivalente a format(fecha,"%b") con locale es)
    `CREATE OR REPLACE MACRO mes_es(m) AS (
       (['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'])[m]
     )`,

    // ---------------------------------------------------------------------
    // 1. Extracción cruda (Postgres → DuckDB). Equivale a preparar_datos.R
    // ---------------------------------------------------------------------

    // 1.1 Pacientes — el sexo se resuelve vía TC_CATALOGO_PADRE (no TC_CATALOGO en
    //     este esquema). DESCRIPCION = código homologado ('1'=Hombre, '2'=Mujer).
    //     etnia no llega a datos_procesados ⇒ se omite (NULL). Filtro fiel al R:
    //     fecha de nacimiento presente + catálogo de sexo activo.
    `CREATE OR REPLACE TABLE raw_patient AS
     SELECT tp."ID"::VARCHAR                     AS id,
            csex."DESCRIPCION"                   AS sexo,
            CAST(NULL AS VARCHAR)                AS etnia,
            tp."FECHA_NACIMIENTO"::DATE          AS fechanac
     FROM ${S}."TR_PACIENTE" tp
     JOIN ${S}."TC_CATALOGO_PADRE" csex ON csex."ID" = tp."CT_SEXO_ID"
     WHERE tp."FECHA_NACIMIENTO" IS NOT NULL AND csex."AUD_ESTADO" = true`,

    // 1.2 Reportes (notificaciones)
    //   caseid  = CODIGO_ORIGEN_NOTIFICACION (reemplaza el coalesce DHIS2/VIGIFLOW del R)
    //   geonoti = CTPARROQUIA_CODIGO (unidad geográfica; hoy sin poblar en la BD)
    `CREATE OR REPLACE TABLE raw_report AS
     SELECT tn."ID"::VARCHAR                     AS id,
            tn."PACIENTE_ID"::VARCHAR            AS patient_id,
            tn."CODIGO_ORIGEN_NOTIFICACION"      AS caseid,
            'ECU'                                AS pais_iso,
            tn."EDAD"                            AS edadinicreg,
            cu."DESCRIPCION"                     AS unidadedad,
            tn."CTPARROQUIA_CODIGO"              AS geonoti,
            tn."FECHA_NOTIFICACION"::DATE        AS fechanot
     FROM ${S}."TR_NOTIFICACION" tn
     LEFT JOIN ${S}."TC_CATALOGO_PADRE" cu ON cu."ID" = tn."CTUNIDADEDAD_ID"
     WHERE tn."FECHA_NOTIFICACION" IS NOT NULL`,

    // 1.3 Eventos ESAVI (codmeddraesavip = CODIGO_LLT)
    `CREATE OR REPLACE TABLE raw_event AS
     SELECT tde."ID"::VARCHAR              AS id,
            tde."NOTIFICACION_ID"::VARCHAR AS report_id,
            tde."CODIGO_LLT"::VARCHAR      AS codmeddraesavip,
            tde."FECHA_ESAVI"::DATE        AS fecinesavi
     FROM ${S}."TR_DATOS_ESAVI" tde
     INNER JOIN ${S}."TR_NOTIFICACION" tn ON tn."ID" = tde."NOTIFICACION_ID"
     WHERE tde."FECHA_ESAVI" IS NOT NULL`,

    // 1.4 Vacunas — esquema actual: TR_DATO_VACUNA se enlaza a la notificación vía
    //     DATO_VACUNACION_ID → TR_DATO_VACUNACION → NOTIFICACION_ID (report_id = tn."ID").
    //     nomcomv = DRUG_NAME (nombre normalizado WHODrug), nomfabri = MA_HOLDER (titular).
    `CREATE OR REPLACE TABLE raw_vaccine AS
     SELECT dv."ID"::VARCHAR                    AS id,
            tn."ID"::VARCHAR                    AS report_id,
            dv."MA_HOLDER"                      AS nomfabri,
            dv."DRUG_NAME"                      AS nomcomv,
            dv."NUMERO_LOTE"                    AS numlote,
            dv."NUMERO_DOSIS_VACUNA"            AS dosis,
            tdv."FECHA_VACUNACION"::DATE        AS fvacunac
     FROM ${S}."TR_DATO_VACUNA" dv
     INNER JOIN ${S}."TR_DATO_VACUNACION" tdv ON tdv."ID" = dv."DATO_VACUNACION_ID"
     INNER JOIN ${S}."TR_NOTIFICACION" tn     ON tn."ID" = tdv."NOTIFICACION_ID"
     WHERE tdv."FECHA_VACUNACION" IS NOT NULL`,

    // 1.5 Gravedad / desenlace
    `CREATE OR REPLACE TABLE raw_soutcome AS
     SELECT tge."ID"::VARCHAR              AS id,
            tge."NOTIFICACION_ID"::VARCHAR AS report_id,
            CASE WHEN tge."MUERTE"             = 'true' THEN 1
                 WHEN tge."RIESGO_VIDA"        = 'true' THEN 2
                 WHEN tge."DISCAPACIDAD"       = 'true' THEN 3
                 WHEN tge."ANOMALIA_CONGENITA" = 'true' THEN 4
                 WHEN tge."HOSPITALIZACION"    = 'true' THEN 5
                 ELSE 0 END                             AS desenesv,
            CASE WHEN tge."MUERTE" = 'true' THEN 1 ELSE 0 END AS mueresav,
            CASE WHEN tge."TIPO_GRAVEDAD" = '1' THEN 1
                 WHEN tge."TIPO_GRAVEDAD" = '0' THEN 0 END AS gravesav
     FROM ${S}."TR_NOTIFICACION" tn
     INNER JOIN ${S}."TR_GRAVEDAD_ESAVI" tge ON tge."NOTIFICACION_ID" = tn."ID"
     INNER JOIN ${S}."TR_DATOS_ESAVI" tde    ON tde."NOTIFICACION_ID" = tn."ID"
     WHERE tge."TIPO_GRAVEDAD" IS NOT NULL`,

    // 1.6 Embarazo
    `CREATE OR REPLACE TABLE raw_pregnancy AS
     SELECT tpe."ID"::VARCHAR              AS id,
            tn."ID"::VARCHAR               AS report_id,
            1                              AS embesavi
     FROM ${S}."TR_NOTIFICACION" tn
     INNER JOIN ${S}."TR_PACIENTE_EMBARAZADA" tpe ON tn."ID" = tpe."NOTIFICACION_ID"`,

    // 1.7 MedDRA (solo Postgres: LLT→PT→SOC). HLT/HLGT/SMQ no existen.
    `CREATE OR REPLACE TABLE ref_meddra AS
     SELECT llt."CODE"::VARCHAR                       AS llt_code,
            COALESCE(pt."NAME", 'Sin PT asociado')    AS pt,
            'Sin HLT asociado'                        AS hlt,
            'Sin HLGT asociado'                       AS hlgt,
            COALESCE(soc."NAME", 'Sin SOC asociado')  AS soc,
            'Sin SMQ asociado'                        AS smq
     FROM ${alias}."MEDDRA"."MED_LLT" llt
     LEFT JOIN ${alias}."MEDDRA"."MED_PT"  pt  ON pt."CODE"  = llt."PT_CODE"
     LEFT JOIN ${alias}."MEDDRA"."MED_SOC" soc ON soc."CODE" = pt."SOC_CODE"`,

    // 1.8 Dosis administradas (vacunómetro). Filtro por rango de fechas de reportes
    //     empujado a Postgres para no traer millones de filas innecesarias.
    `CREATE OR REPLACE TABLE raw_dosis AS
     SELECT tv."FECHA_APLICACION"::DATE AS fecha_sem_epi,
            tv."GRUPO_ETARIO"           AS grupo_etario,
            v.sexo                      AS sexo,
            CASE WHEN v.sexo = 'Hombre' THEN tv."TOTAL_HOMBRES"
                 ELSE tv."TOTAL_MUJERES" END AS "NumDosis"
     FROM ${S}."TR_VACUNOMETRO" tv
     CROSS JOIN (SELECT 'Hombre' AS sexo UNION ALL SELECT 'Mujer') v
     WHERE tv."FECHA_APLICACION" BETWEEN
             (SELECT MIN("FECHA_NOTIFICACION")::DATE FROM ${S}."TR_NOTIFICACION")
         AND (SELECT MAX("FECHA_NOTIFICACION")::DATE FROM ${S}."TR_NOTIFICACION")`,

    // ---------------------------------------------------------------------
    // 2. Dimensiones / intermedias. Equivale a la sección de procesamiento.
    // ---------------------------------------------------------------------

    // 2.1 Pacientes deduplicados (replica unique(df, by = sexo,fechanac,etnia))
    `CREATE OR REPLACE TABLE dim_patient AS
     SELECT id AS patient_id, sexo, fechanac, etnia
     FROM (
       SELECT id, sexo, fechanac, etnia,
              row_number() OVER (PARTITION BY sexo, fechanac, etnia ORDER BY id) AS rn
       FROM raw_patient
     ) WHERE rn = 1`,

    // 2.2 Eventos + jerarquía MedDRA + id_event_smq (índice de fila; sin SMQ = 1 fila/evento)
    `CREATE OR REPLACE TABLE dim_event AS
     SELECT row_number() OVER (ORDER BY e.id)          AS id_event_smq,
            e.id                                       AS event_id,
            e.report_id,
            e.codmeddraesavip,
            e.fecinesavi,
            COALESCE(m.pt,  'Sin PT asociado')         AS pt,
            COALESCE(m.hlt, 'Sin HLT asociado')        AS hlt,
            COALESCE(m.hlgt,'Sin HLGT asociado')       AS hlgt,
            COALESCE(m.soc, 'Sin SOC asociado')        AS soc,
            COALESCE(m.smq, 'Sin SMQ asociado')        AS smq
     FROM raw_event e
     LEFT JOIN ref_meddra m ON m.llt_code = e.codmeddraesavip`,

    // 2.3 Vacunas normalizadas
    `CREATE OR REPLACE TABLE dim_vaccine AS
     SELECT id AS vaccine_id,
            report_id,
            nomfabri,
            COALESCE(tc(nomcomv), 'Sin info') AS nomcomv,
            upper(strip_accents(CAST(numlote AS VARCHAR))) AS numlote,
            dosis,
            fvacunac
     FROM raw_vaccine`,

    // 2.4 Fechas mínimas por reporte
    `CREATE OR REPLACE TABLE rep_fvac AS
     SELECT report_id, MIN(fvacunac) AS fvacunac FROM dim_vaccine GROUP BY report_id`,
    `CREATE OR REPLACE TABLE rep_fini AS
     SELECT report_id, MIN(fecinesavi) AS fecinesavi FROM raw_event GROUP BY report_id`,

    // 2.5 Marcas por reporte (grave / muerte / embarazo / desenlace)
    `CREATE OR REPLACE TABLE rep_grave AS
     SELECT report_id,
            CASE WHEN s = 1 THEN 'Grave' WHEN s = 0 THEN 'No grave' ELSE 'Sin info' END AS marca_grave
     FROM (SELECT report_id, SUM(gravesav) AS s
           FROM (SELECT DISTINCT report_id, gravesav FROM raw_soutcome WHERE gravesav IN (0,1))
           GROUP BY report_id)`,
    `CREATE OR REPLACE TABLE rep_muerte AS
     SELECT report_id,
            CASE WHEN s = 1 THEN 'Sí' WHEN s = 0 THEN 'No' ELSE 'Sin info' END AS marca_muerte
     FROM (SELECT report_id, SUM(mueresav) AS s
           FROM (SELECT DISTINCT report_id, mueresav FROM raw_soutcome WHERE mueresav IN (0,1))
           GROUP BY report_id)`,
    `CREATE OR REPLACE TABLE rep_embarazo AS
     SELECT report_id,
            CASE WHEN m = 1 THEN 'Sí' WHEN m = 2 THEN 'No'
                 WHEN m = 3 THEN 'Desconocido' WHEN m = 4 THEN 'No aplica'
                 ELSE 'Sin info' END AS marca_embarazo
     FROM (SELECT report_id, MIN(embesavi) AS m
           FROM (SELECT DISTINCT report_id, embesavi FROM raw_pregnancy WHERE embesavi IN (1,2,3,4))
           GROUP BY report_id)`,
    `CREATE OR REPLACE TABLE rep_desenlace AS
     SELECT report_id,
            CASE d WHEN 0 THEN 'Desconocido' WHEN 1 THEN 'Recuperado completamente'
                   WHEN 2 THEN 'En recuperación' WHEN 3 THEN 'No recuperado'
                   WHEN 4 THEN 'Recuperado consecuelas' WHEN 5 THEN 'Muerte'
                   ELSE 'Sin info' END AS desenesv
     FROM (SELECT report_id, MIN(desenesv) AS d
           FROM (SELECT DISTINCT report_id, desenesv FROM raw_soutcome WHERE desenesv IN (0,1,2,3,4,5))
           GROUP BY report_id)`,

    // 2.6 Reportes enriquecidos (edad, grupos, sexo, marcas, sem-epi, dias_vac_ini)
    `CREATE OR REPLACE TABLE dim_report AS
     WITH base AS (
       SELECT r.id AS report_id, r.caseid, r.pais_iso, r.edadinicreg, r.unidadedad,
              r.geonoti, r.fechanot,
              p.sexo AS sexo_raw, p.fechanac, p.etnia,
              fv.fvacunac, fi.fecinesavi
       FROM raw_report r
       LEFT JOIN dim_patient p ON p.patient_id = r.patient_id
       LEFT JOIN rep_fvac fv   ON fv.report_id = r.id
       LEFT JOIN rep_fini fi   ON fi.report_id = r.id
     ),
     calc AS (
       SELECT *,
         -- edad en años
         COALESCE(
           CASE WHEN unidadedad = '1' THEN CAST(edadinicreg AS DOUBLE)
                WHEN unidadedad = '2' THEN round(CAST(edadinicreg AS DOUBLE)/12, 2)
                WHEN unidadedad = '3' THEN round(CAST(edadinicreg AS DOUBLE)/365.25, 2)
                ELSE NULL END,
           CASE WHEN fechanac IS NOT NULL AND fechanot IS NOT NULL
                THEN date_diff('day', fechanac, fechanot)/365.25 ELSE NULL END
         ) AS edad,
         -- días vacuna → inicio (INTEGER para evitar integer64 en el driver R)
         CAST(
           CASE WHEN fvacunac IS NULL THEN 999999
                WHEN fecinesavi IS NOT NULL THEN date_diff('day', fvacunac, fecinesavi)
                WHEN fechanot IS NOT NULL THEN date_diff('day', fvacunac, fechanot)
                ELSE 999999 END
         AS INTEGER) AS dias_vac_ini
       FROM base
     )
     SELECT
       report_id, caseid, pais_iso, geonoti_norm AS geonoti, fechanot, fvacunac, fecinesavi,
       edad, dias_vac_ini,
       -- categoría de días vacuna→inicio
       CASE WHEN dias_vac_ini = 999999 THEN 'Sin Info'
            WHEN dias_vac_ini < -365 OR dias_vac_ini > 365 THEN 'Fechas Inconsistentes'
            WHEN dias_vac_ini < 0 THEN 'Síntomas antes de vacuna'
            WHEN dias_vac_ini < 8 THEN CASE WHEN dias_vac_ini = 1 THEN '1 día' ELSE dias_vac_ini || ' días' END
            WHEN dias_vac_ini < 16 THEN '8-15 días'
            WHEN dias_vac_ini < 31 THEN '16-30 días'
            WHEN dias_vac_ini < 61 THEN '31-60 días'
            WHEN dias_vac_ini < 366 THEN '60 días a 1 año'
            ELSE 'Otro' END AS dias_vac_ini_cat,
       -- grupo etario
       CASE WHEN edad IS NULL THEN 'Sin info'
            WHEN edad < 0 THEN 'Sin info'
            WHEN edad < 18 THEN '<18 años'   WHEN edad < 25 THEN '18-24 años'
            WHEN edad < 50 THEN '25-49 años' WHEN edad < 60 THEN '50-59 años'
            WHEN edad < 70 THEN '60-69 años' WHEN edad < 80 THEN '70-79 años'
            WHEN edad < 125 THEN '>80 años'  ELSE 'Sin info' END AS grupo_etario,
       -- grupo etario con el bucketing del vacunómetro (HCUE), para comparar
       -- notificaciones vs dosis en la pirámide poblacional (mismos rangos).
       CASE WHEN edad IS NULL OR edad < 0 THEN 'Sin info'
            WHEN edad < 2  THEN '0-1 años'   WHEN edad < 5  THEN '2-4 años'
            WHEN edad < 10 THEN '5-9 años'   WHEN edad < 15 THEN '10-14 años'
            WHEN edad < 20 THEN '15-19 años' WHEN edad < 65 THEN '20-64 años'
            ELSE '65+ años' END AS grupo_etario_hcue,
       -- grupo etario menores
       CASE WHEN edad IS NULL THEN 'Sin info'
            WHEN edad < 0 THEN 'Sin info'
            WHEN edad < 1 THEN '[0-1) años'   WHEN edad < 5 THEN '[1-5) años'
            WHEN edad < 10 THEN '[5-10) años' WHEN edad < 15 THEN '[10-15) años'
            WHEN edad < 18 THEN '[15-18) años' ELSE 'No aplica' END AS grupo_etario_menores,
       CASE WHEN edad < 18 THEN 'Sí' WHEN edad >= 18 THEN 'No' ELSE NULL END AS marca_menores,
       -- sexo (homologada 1/2/3 o texto). NULL → Sin info
       CASE WHEN sexo_raw IS NULL THEN 'Sin info'
            WHEN sexo_raw IN ('1','Hombre') THEN 'Masculino'
            WHEN sexo_raw IN ('2','Mujer')  THEN 'Femenino'
            WHEN sexo_raw IN ('3','Otro')   THEN 'Otro'
            ELSE 'Sin info' END AS sexo,
       -- país
       CASE WHEN pais_iso = 'ECU' THEN 'Ecuador' ELSE NULL END AS geo_pais,
       -- semana epidemiológica (aprox MMWR: ISO sobre fecha+1 día)
       CAST(extract(isoyear FROM fechanot + INTERVAL 1 DAY) AS INT) AS "añoNoti",
       mes_es(CAST(extract(month FROM fechanot) AS INT)) AS "mesNoti",
       CAST(extract(year FROM fechanot) AS INT) * 100 + CAST(extract(month FROM fechanot) AS INT) AS "periodoNoti",
       CAST(extract(isoyear FROM fechanot + INTERVAL 1 DAY) AS INT) * 100
         + CAST(extract(week FROM fechanot + INTERVAL 1 DAY) AS INT) AS "semEpiNoti"
     FROM (
       SELECT c.*, tc(c.geonoti) AS geonoti_norm FROM calc c
     )`,

    // Adjuntar marcas al reporte
    `CREATE OR REPLACE TABLE dim_report_full AS
     SELECT dr.*,
            COALESCE(g.marca_grave,   'Sin info') AS marca_grave,
            COALESCE(mu.marca_muerte, 'Sin info') AS marca_muerte,
            COALESCE(e.marca_embarazo,'Sin info') AS marca_embarazo,
            COALESCE(d.desenesv,      'Sin info') AS desenesv
     FROM dim_report dr
     LEFT JOIN rep_grave g     ON g.report_id  = dr.report_id
     LEFT JOIN rep_muerte mu   ON mu.report_id = dr.report_id
     LEFT JOIN rep_embarazo e  ON e.report_id  = dr.report_id
     LEFT JOIN rep_desenlace d ON d.report_id  = dr.report_id`,

    // ---------------------------------------------------------------------
    // 3. Tablas finales para el dashboard
    // ---------------------------------------------------------------------

    // 3.1 dosis_admin
    `CREATE OR REPLACE TABLE dosis_admin AS
     SELECT fecha_sem_epi,
            CAST(extract(week FROM fecha_sem_epi) AS INT) AS "semEpiNoti",
            CASE WHEN sexo = 'Hombre' THEN 'Masculino'
                 WHEN sexo = 'Mujer'  THEN 'Femenino'
                 ELSE 'No epecificado' END AS sexo,
            grupo_etario,
            -- etiqueta del bucketing HCUE (códigos 1-7 → rangos), para la pirámide
            CASE CAST(grupo_etario AS VARCHAR)
                 WHEN '1' THEN '0-1 años'   WHEN '2' THEN '2-4 años'
                 WHEN '3' THEN '5-9 años'   WHEN '4' THEN '10-14 años'
                 WHEN '5' THEN '15-19 años' WHEN '6' THEN '20-64 años'
                 WHEN '7' THEN '65+ años'   ELSE 'Sin info' END AS grupo_etario_hcue,
            "NumDosis",
            CAST(extract(year FROM fecha_sem_epi) AS INT) AS "añoNoti",
            mes_es(CAST(extract(month FROM fecha_sem_epi) AS INT)) AS "mesNoti",
            CAST(extract(year FROM fecha_sem_epi) AS INT) * 100
              + CAST(extract(month FROM fecha_sem_epi) AS INT) AS "periodoNoti"
     FROM raw_dosis`,

    // 3.2 datos_procesados (tabla-hecho: reporte × evento × vacuna)
    `CREATE OR REPLACE TABLE datos_procesados AS
     WITH unif AS (
       SELECT r.report_id, ev.id_event_smq, vc.vaccine_id
       FROM dim_report_full r
       LEFT JOIN dim_event ev  ON ev.report_id = r.report_id
       LEFT JOIN dim_vaccine vc ON vc.report_id = r.report_id
     )
     SELECT DISTINCT
       u.report_id, r.caseid, r.fechanot, r."añoNoti", r."mesNoti", r."periodoNoti", r."semEpiNoti",
       r.edad, r.grupo_etario, r.grupo_etario_menores, r.grupo_etario_hcue, r.sexo, r.geo_pais, r.pais_iso, r.geonoti,
       r.desenesv, r.marca_grave, r.marca_menores, r.marca_embarazo, r.marca_muerte,
       r.fvacunac, r.fecinesavi, r.dias_vac_ini_cat, r.dias_vac_ini,
       u.id_event_smq, ev.event_id, ev.pt, ev.hlt, ev.hlgt, ev.soc, ev.smq,
       vc.vaccine_id, vc.nomcomv, vc.nomfabri, vc.dosis, vc.numlote,
       -- alias de compatibilidad con server.R
       r.caseid   AS "numeroNotificacao",
       r.fechanot AS "dataNotificacao",
       vc.vaccine_id AS id_vaccine,
       vc.dosis   AS "doseImunobiologico"
     FROM unif u
     LEFT JOIN dim_report_full r ON r.report_id = u.report_id
     LEFT JOIN dim_event ev      ON ev.id_event_smq = u.id_event_smq
     LEFT JOIN dim_vaccine vc    ON vc.vaccine_id = u.vaccine_id`,

    // ---------------------------------------------------------------------
    // 4. Metadatos + limpieza de intermedias
    // ---------------------------------------------------------------------
    `CREATE OR REPLACE TABLE _meta AS
     SELECT 'datos_procesados' AS tabla, (SELECT COUNT(*) FROM datos_procesados) AS filas
     UNION ALL SELECT 'dosis_admin', (SELECT COUNT(*) FROM dosis_admin)`,

    `DROP TABLE IF EXISTS raw_patient`,
    `DROP TABLE IF EXISTS raw_report`,
    `DROP TABLE IF EXISTS raw_event`,
    `DROP TABLE IF EXISTS raw_vaccine`,
    `DROP TABLE IF EXISTS raw_soutcome`,
    `DROP TABLE IF EXISTS raw_pregnancy`,
    `DROP TABLE IF EXISTS raw_dosis`,
    `DROP TABLE IF EXISTS ref_meddra`,
    `DROP TABLE IF EXISTS dim_patient`,
    `DROP TABLE IF EXISTS dim_event`,
    `DROP TABLE IF EXISTS dim_vaccine`,
    `DROP TABLE IF EXISTS rep_fvac`,
    `DROP TABLE IF EXISTS rep_fini`,
    `DROP TABLE IF EXISTS rep_grave`,
    `DROP TABLE IF EXISTS rep_muerte`,
    `DROP TABLE IF EXISTS rep_embarazo`,
    `DROP TABLE IF EXISTS rep_desenlace`,
    `DROP TABLE IF EXISTS dim_report`,
    `DROP TABLE IF EXISTS dim_report_full`,
  ];
}
