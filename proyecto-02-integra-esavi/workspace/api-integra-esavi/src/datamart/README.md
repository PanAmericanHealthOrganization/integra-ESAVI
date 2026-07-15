# Módulo `datamart`

Genera un **único archivo DuckDB** (`esavi.duckdb`) con las tablas ya procesadas
que consume el dashboard `dash-integra-esavi`, reemplazando el pipeline de
archivos RDS (`preparar_datos.R` + `scripts/procesamiento_datos.R`).

## Flujo

1. Abre un DuckDB temporal en el mismo directorio del destino.
2. Adjunta Postgres en modo **READ_ONLY** vía la extensión `postgres` de DuckDB.
3. Ejecuta el SQL de extracción + transformación (`sql/datamart-sql.ts`),
   portado desde `procesamiento_datos.R`. Todo el cómputo ocurre **dentro de
   DuckDB**; Postgres operacional no se modifica.
4. Deja dos tablas finales: `datos_procesados` (tabla-hecho reporte×evento×vacuna)
   y `dosis_admin`, además de `_meta` (conteos).
5. Cierra y **renombra** el temporal sobre el destino (swap atómico): el
   dashboard nunca lee un archivo a medio escribir.

## Disparadores

- **Cron diario** (`DatamartService.scheduledBuild`, por defecto 02:00). El
  `@Cron` lo descubre el explorer global de `@nestjs/schedule` (registrado una
  vez en `WhodrugsModule`); este módulo **no** llama a `ScheduleModule.forRoot()`.
- **On-demand**: `POST /v1/datamart/regenerar`. Estado en `GET /v1/datamart/estado`.

Un lock en memoria evita ejecuciones solapadas (cron + on-demand).

## Configuración (env)

| Variable | Descripción | Default |
|---|---|---|
| `DATAMART_DUCKDB_PATH` | Ruta del `.duckdb` de salida (volumen compartido con el dashboard) | `datos/esavi.duckdb` |
| `DATAMART_TMP_DIR` | Directorio temporal para el swap | dir del archivo de salida |
| `DATAMART_CRON` | Expresión cron de regeneración | `0 2 * * *` |
| `DATAMART_CRON_ENABLED` | `false` desactiva el cron (deja solo on-demand) | `true` |
| `HOST/PORT/USER/PASS/NAME/SCHEMA_DATABASE` | Conexión Postgres (compartida con el API) | — |

## Requisitos de despliegue

- La imagen del API debe poder cargar la extensión `postgres` de DuckDB. En el
  primer arranque se descarga (`INSTALL postgres`); en entornos sin red hay que
  pre-empaquetar la extensión o cachear `~/.duckdb/extensions`.

## Decisiones y notas de paridad (portado desde R)

- **MedDRA solo desde Postgres** (`MED_LLT→MED_PT→MED_SOC`, v27). No existen
  HLT/HLGT/SMQ en la BD ⇒ quedan como `"Sin ... asociado"`.
- **Bug corregido**: las vacunas se unen por `NOTIFICACION_ID`
  (`TR_DATO_VACUNA.DATO_VACUNACION_ID → TR_DATO_VACUNACION.NOTIFICACION_ID`); el
  R original usaba el id de vacunación y nunca cruzaba.
- **Catálogos**: sexo y unidad de edad se resuelven vía `TC_CATALOGO_PADRE`
  (`DESCRIPCION` = código homologado), no `TC_CATALOGO`.
- **Mapeos de esquema** (distinto al que asumía `preparar_datos.R`):
  `caseid = CODIGO_ORIGEN_NOTIFICACION`, `nomcomv = DRUG_NAME`,
  `nomfabri = MA_HOLDER`, `geonoti = CTPARROQUIA_CODIGO`.
- **Puntos a validar contra el dashboard/RDS actual**:
  - Semana epidemiológica: calculada (aprox. MMWR/PAHO = ISO sobre fecha+1 día).
  - `geonoti`: la unidad geográfica no está poblada en la BD (queda null).
  - Title-case de nombres (`tc()` macro) vs `tools::toTitleCase` del R.
