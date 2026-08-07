-- =====================================================================================
-- Migración del modelo de datos DHI_ESAVI — observaciones 1 a 20
--
-- El proyecto no usa migraciones de TypeORM: el esquema se propaga con `synchronize: true`
-- solo cuando ENV=DEV. En DEV este script NO hace falta (TypeORM aplica los cambios de las
-- entidades al arrancar). En PROD, donde synchronize está desactivado, hay que ejecutarlo
-- a mano ANTES de desplegar el código.
--
-- Ejecutar dentro de una transacción y con respaldo previo:
--   pg_dump -n DHI_ESAVI ... > respaldo.sql
--   psql -d dhi_esavi -v ON_ERROR_STOP=1 -f observaciones-modelo-datos.sql
--
-- Orden: primero se copian los datos que se conservan, después se eliminan las columnas.
-- =====================================================================================

BEGIN;

-- -------------------------------------------------------------------------------------
-- Obs 1 y 4 — ORIGEN_ORIGINAL
-- El integrador escribía el MISMO objeto en TR_PACIENTE y TR_NOTIFICACION. Su contenido es
-- demográfico del paciente, así que el snapshot se conserva una sola vez, en TR_PACIENTE,
-- y se renombra: el nombre sugería identificar la fuente, cosa que ya hacen
-- TR_NOTIFICACION.ORIGEN y CODIGO_ORIGEN.
-- -------------------------------------------------------------------------------------
ALTER TABLE "DHI_ESAVI"."TR_PACIENTE"
  RENAME COLUMN "ORIGEN_ORIGINAL" TO "PAYLOAD_ORIGEN";

-- Rescate: si alguna notificación tuviera payload y su paciente no, se conserva el dato
-- antes de borrar la columna duplicada.
UPDATE "DHI_ESAVI"."TR_PACIENTE" p
   SET "PAYLOAD_ORIGEN" = n."ORIGEN_ORIGINAL"
  FROM "DHI_ESAVI"."TR_NOTIFICACION" n
 WHERE n."PACIENTE_ID" = p."ID"
   AND p."PAYLOAD_ORIGEN" IS NULL
   AND n."ORIGEN_ORIGINAL" IS NOT NULL;

ALTER TABLE "DHI_ESAVI"."TR_NOTIFICACION" DROP COLUMN IF EXISTS "ORIGEN_ORIGINAL";

-- -------------------------------------------------------------------------------------
-- Obs 5 y 6 — TR_DATOS_ESAVI: semántica de nombres y tipo de registro
-- NOMBRE_ESAVI pasa a ser el término estandarizado (LLT MedDRA) y NOMBRE_ESAVI_REPORTADO el
-- texto original. Hasta ahora VigiFlow escribía el LLT en el campo "reportado" y dejaba
-- NOMBRE_ESAVI vacío: la semántica estaba invertida.
-- -------------------------------------------------------------------------------------
UPDATE "DHI_ESAVI"."TR_DATOS_ESAVI"
   SET "NOMBRE_ESAVI" = "NOMBRE_ESAVI_REPORTADO"
 WHERE "NOMBRE_ESAVI" IS NULL
   AND "NOMBRE_ESAVI_REPORTADO" IS NOT NULL
   AND "CODIGO_ESAVI_MEDDRA_LLT" IS NOT NULL;  -- solo si venía homologado

-- DESCRIPCION nunca guardó la narrativa del caso (esa vive una sola vez por caso en
-- TR_NOTIFICACION.CASO_NARRATIVO) sino etiquetas del tipo "Diagnóstico inicial DHIS2 1".
-- Se convierte en un catálogo cerrado.
CREATE TYPE "DHI_ESAVI"."tipo_registro_esavi_enum" AS ENUM (
  'DIAGNOSTICO_INICIAL', 'DIAGNOSTICO_FINAL', 'SINTOMATOLOGIA', 'REACCION'
);

ALTER TABLE "DHI_ESAVI"."TR_DATOS_ESAVI"
  ADD COLUMN "TIPO_REGISTRO_ESAVI" "DHI_ESAVI"."tipo_registro_esavi_enum";

UPDATE "DHI_ESAVI"."TR_DATOS_ESAVI"
   SET "TIPO_REGISTRO_ESAVI" = CASE
     WHEN "DESCRIPCION" ILIKE 'Diagn%stico inicial%' THEN 'DIAGNOSTICO_INICIAL'
     WHEN "DESCRIPCION" ILIKE 'Diagn%stico final%'   THEN 'DIAGNOSTICO_FINAL'
     WHEN "DESCRIPCION" ILIKE 'Sintomatolog%'        THEN 'SINTOMATOLOGIA'
     ELSE 'REACCION'  -- el resto proviene de la hoja Reacciones de VigiFlow
   END::"DHI_ESAVI"."tipo_registro_esavi_enum";

ALTER TABLE "DHI_ESAVI"."TR_DATOS_ESAVI" DROP COLUMN IF EXISTS "DESCRIPCION";

-- -------------------------------------------------------------------------------------
-- Obs 9 — COGIDO_CASO era una copia del código de la notificación repetida en cada evento.
-- La correspondencia 1 caso → N eventos ya la garantiza la FK NOTIFICACION_ID.
-- (El nombre de la columna traía la errata "COGIDO"; se elimina tal cual está.)
-- -------------------------------------------------------------------------------------
ALTER TABLE "DHI_ESAVI"."TR_DATOS_ESAVI" DROP COLUMN IF EXISTS "COGIDO_CASO";

-- -------------------------------------------------------------------------------------
-- Obs 10 — GRAVEDAD no corresponde al evento sino al caso, y se evalúa en TR_GRAVEDAD_ESAVI.
-- La columna nunca llegó a poblarse desde ningún integrador.
-- -------------------------------------------------------------------------------------
ALTER TABLE "DHI_ESAVI"."TR_DATOS_ESAVI" DROP COLUMN IF EXISTS "GRAVEDAD";

-- -------------------------------------------------------------------------------------
-- Obs 12 — DRUG_NAME mezclaba el nombre WHODrug con el nombre reportado: el integrador lo
-- inicializaba con el texto de la fuente y el match WHODrug lo sobrescribía, perdiendo el
-- original. Se separan en dos columnas.
-- -------------------------------------------------------------------------------------
ALTER TABLE "DHI_ESAVI"."TR_DATO_VACUNA"
  ADD COLUMN IF NOT EXISTS "NOMBRE_VACUNA_REPORTADO" varchar;

-- Las filas sin DRUG_CODE nunca tuvieron match WHODrug: su DRUG_NAME es, de hecho, el
-- nombre reportado. Se mueve y se limpia DRUG_NAME, que queda solo para valores homologados.
UPDATE "DHI_ESAVI"."TR_DATO_VACUNA"
   SET "NOMBRE_VACUNA_REPORTADO" = "DRUG_NAME",
       "DRUG_NAME" = NULL
 WHERE "DRUG_CODE" IS NULL
   AND "DRUG_NAME" IS NOT NULL;

-- -------------------------------------------------------------------------------------
-- Obs 16 — DURACION_TRATAMIENTO no aporta al análisis: una vacuna se administra en un acto
-- único, no es un tratamiento con duración.
-- -------------------------------------------------------------------------------------
ALTER TABLE "DHI_ESAVI"."TR_DATO_VACUNA" DROP COLUMN IF EXISTS "DURACION_TRATAMIENTO";

-- -------------------------------------------------------------------------------------
-- Obs 17 — FIN_ADMINISTRACION se elimina. INICIO_ADMINISTRACION se conserva como respaldo
-- de FECHA_VACUNACION, que es la variable de análisis.
-- -------------------------------------------------------------------------------------
UPDATE "DHI_ESAVI"."TR_DATO_VACUNACION"
   SET "FECHA_VACUNACION" = "INICIO_ADMINISTRACION"
 WHERE "FECHA_VACUNACION" IS NULL
   AND "INICIO_ADMINISTRACION" IS NOT NULL;

ALTER TABLE "DHI_ESAVI"."TR_DATO_VACUNACION" DROP COLUMN IF EXISTS "FIN_ADMINISTRACION";

-- -------------------------------------------------------------------------------------
-- Obs 18 — Columnas duplicadas en TR_DATO_VACUNACION.
-- Causa raíz: dos entidades TypeORM (DatoVacunacion y una entidad "Vacunacion" muerta)
-- apuntaban a la MISMA tabla con nombres de columna distintos, y `synchronize: true` creó la
-- unión de ambos conjuntos. Se conservan las columnas que sí tienen datos.
-- -------------------------------------------------------------------------------------
UPDATE "DHI_ESAVI"."TR_DATO_VACUNACION"
   SET "FECHARECONSTITUCIONVACUNA" = COALESCE("FECHARECONSTITUCIONVACUNA", "FECHA_RECONSTITUCION_VACUNA"),
       "HORARECONSTITUCIONVACUNA"  = COALESCE("HORARECONSTITUCIONVACUNA",  "HORA_RECONSTITUCION_VACUNA");

ALTER TABLE "DHI_ESAVI"."TR_DATO_VACUNACION"
  DROP COLUMN IF EXISTS "FECHA_RECONSTITUCION_VACUNA",
  DROP COLUMN IF EXISTS "HORA_RECONSTITUCION_VACUNA";

-- -------------------------------------------------------------------------------------
-- Obs 19 — TR_PACIENTE_EMBARAZADA se unifica en TR_ANTECEDENTES_EMBARAZO.
-- Ambas eran 1:1 contra NOTIFICACION_ID: una guardaba el estado y la otra los datos clínicos
-- del mismo embarazo. TR_ESAVI_DURANTE_EMBARAZO NO se toca: registra eventos (N por caso).
-- -------------------------------------------------------------------------------------
ALTER TABLE "DHI_ESAVI"."TR_ANTECEDENTES_EMBARAZO"
  ADD COLUMN IF NOT EXISTS "EMBARAZADA_MOMENTO_VACUNA" varchar,
  ADD COLUMN IF NOT EXISTS "EMBARAZADA_MOMENTO_ESAVI"  varchar;

-- Notificaciones que ya tienen antecedente: se completan los dos flags.
UPDATE "DHI_ESAVI"."TR_ANTECEDENTES_EMBARAZO" a
   SET "EMBARAZADA_MOMENTO_VACUNA" = pe."EMBARAZADA_MOMENTO_VACUNA",
       "EMBARAZADA_MOMENTO_ESAVI"  = pe."EMBARAZADA_MOMENTO_ESAVI"
  FROM "DHI_ESAVI"."TR_PACIENTE_EMBARAZADA" pe
 WHERE pe."NOTIFICACION_ID" = a."NOTIFICACION_ID";

-- Notificaciones que SOLO tenían TR_PACIENTE_EMBARAZADA: se crea el antecedente para no
-- perder el registro de embarazo.
INSERT INTO "DHI_ESAVI"."TR_ANTECEDENTES_EMBARAZO"
       ("ID", "NOTIFICACION_ID", "EMBARAZADA_MOMENTO_VACUNA", "EMBARAZADA_MOMENTO_ESAVI",
        "createdAt", "createdBy", "isActive", "isEnabled")
SELECT gen_random_uuid(), pe."NOTIFICACION_ID",
       pe."EMBARAZADA_MOMENTO_VACUNA", pe."EMBARAZADA_MOMENTO_ESAVI",
       now(), 'MIGRACION_OBS_19', true, true
  FROM "DHI_ESAVI"."TR_PACIENTE_EMBARAZADA" pe
 WHERE NOT EXISTS (
   SELECT 1 FROM "DHI_ESAVI"."TR_ANTECEDENTES_EMBARAZO" a
    WHERE a."NOTIFICACION_ID" = pe."NOTIFICACION_ID"
 );

DROP TABLE IF EXISTS "DHI_ESAVI"."TR_PACIENTE_EMBARAZADA";

-- -------------------------------------------------------------------------------------
-- Obs 2, 3, 7, 11, 13, 15 y 20 no requieren cambios de esquema: son correcciones de código
-- (homologación de profesión unificada, LLT MedDRA y WHODrug para DHIS2, discriminador de
-- origen, y renombrado de propiedades en la entidad sin tocar nombres de columna).
-- -------------------------------------------------------------------------------------

COMMIT;

-- =====================================================================================
-- Obs 8 — Verificación posterior: cuánto del legado quedó sin homologar.
-- No modifica datos; sirve para dimensionar la re-homologación retroactiva.
-- =====================================================================================
-- SELECT n."ORIGEN",
--        count(*)                                                    AS eventos,
--        count(*) FILTER (WHERE d."CODIGO_ESAVI_MEDDRA_LLT" IS NULL) AS sin_llt,
--        count(*) FILTER (WHERE d."NOMBRE_ESAVI" IS NULL)            AS sin_termino_estandarizado,
--        round(100.0 * count(*) FILTER (WHERE d."CODIGO_ESAVI_MEDDRA_LLT" IS NULL) / count(*), 1) AS pct_sin_llt
--   FROM "DHI_ESAVI"."TR_DATOS_ESAVI" d
--   JOIN "DHI_ESAVI"."TR_NOTIFICACION" n ON n."ID" = d."NOTIFICACION_ID"
--  GROUP BY n."ORIGEN";
