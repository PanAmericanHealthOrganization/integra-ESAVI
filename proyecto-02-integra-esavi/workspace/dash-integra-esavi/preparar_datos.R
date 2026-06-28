# Cargar variables de entorno si existen
if (file.exists(".env")) {
  readRenviron(".env")
}

library(RPostgres)
library(DBI)

base_rds_path <- "fuente_de_datos"
if (!dir.exists(base_rds_path)) {
	dir.create(base_rds_path, recursive = TRUE)
}

consultar_postgres <- function(query) {
	# Parámetros de conexión
	host <- Sys.getenv("DB_HOST")
	port <- as.integer(Sys.getenv("DB_PORT"))
	dbname <- Sys.getenv("DB_NAME")
	user <- Sys.getenv("DB_USER")
	password <- Sys.getenv("DB_PASS")
  # Establecer conexión
  con <- dbConnect(
    RPostgres::Postgres(),
    host = host,
    port = port,
    dbname = dbname,
    user = user,
    password = password
  )

  tryCatch({
    # Ejecutar consulta
    resultado <- dbGetQuery(con, query)
    return(resultado)
  }, error = function(e) {
    message("Error en la consulta: ", e$message)
    return(NULL)
  }, finally = {
    # Cerrar conexión
    dbDisconnect(con)
  })
}


# Definir la consulta SQL
query_paciente <- r"[
select
	tp."ID" as id,
	tc."DESCRIPCION_HOMOLOGADA" as sexo, -- hombre, mujer
	tc2."DESCRIPCION_HOMOLOGADA" as etnia , -- null
	tp."FECHA_NACIMIENTO" AS fechanac --
from
	dhi_esavi."TR_PACIENTE" tp
left join dhi_esavi."TC_CATALOGO" tc on
	tc."ID" = tp."CT_SEXO_ID"
left join dhi_esavi."TC_CATALOGO" tc2 on
	tc2."ID" = tp."CT_AUTO_IDENTIFICACION_ETNICA_ID"
	where tp."FECHA_NACIMIENTO" is not null and tc."AUD_ESTADO" = true
order by tp."FECHA_NACIMIENTO"
]"

# Ejecutar la consulta	
reg_paciente <- consultar_postgres(query_paciente)

# Guardar el resultado en archivo RDS
if (!is.null(reg_paciente)) {
  saveRDS(reg_paciente, file.path(base_rds_path, "db_reg_patient.rds"))
  message("Datos guardados en db_reg_patient.rds")
} else {
  message("No se pudieron obtener los datos")
}



query_db_reg_report <- r"[
  select
	tn."ID" as id,
	tn."PACIENTE_ID" as patient_id,
	case
		when tn."CODIGO_DHIS2_EVENTO" is null then tn."CODIGO_VIGIFLOW"
		else tn."CODIGO_DHIS2_EVENTO"
	end as caseid ,
	'ECU' as pais_iso,
	tn."EDAD" as edadinicreg,
	tc."DESCRIPCION_HOMOLOGADA" as "unidadedad" ,
	tn."ORGANIZACION_UNIT_CODIGO" as "geonoti" ,
	tn."FECHA_NOTIFICACION" as "fechanot"
from
	dhi_esavi."TR_NOTIFICACION" tn
	left join dhi_esavi."TC_CATALOGO" tc on tc."ID" = tn."CTUNIDADEDAD_ID"
	where tn."FECHA_NOTIFICACION"  is not null]"


# Ejecutar la consulta
reg_report <- consultar_postgres(query_db_reg_report)

# Guardar el resultado en archivo RDS
if (!is.null(reg_report)) {
  saveRDS(reg_report, file.path(base_rds_path, "db_reg_report.rds"))
  message("Datos guardados en db_reg_report.rds")
} else {
  message("No se pudieron obtener los datos")
}

query_eventos <- r"[select
	tde."ID" as id,
	tde."NOTIFICACION_ID" as report_id,
	tde."CODIGO_LLT" as codmeddraesavip,
	tde."FECHA_ESAVI" as fecinesavi
from
	dhi_esavi."TR_DATOS_ESAVI" tde
inner join dhi_esavi."TR_NOTIFICACION" tn on
	tn."ID" = tde."NOTIFICACION_ID"
where tde."FECHA_ESAVI" is not null]"
# Ejecutar la consulta
reg_event <- consultar_postgres(query_eventos)
# Guardar el resultado en archivo RDS
if (!is.null(reg_event)) {
  saveRDS(reg_event, file.path(base_rds_path, "db_reg_event.rds"))
  message("Datos guardados en db_reg_event.rds")
} else {
  message("No se pudieron obtener los datos")
}


query_df_vaccine <- r"[
select
	dv."ID" as id,
	tdv."ID" as report_id,
	dv."NOMBRE_FABRICANTE_WHO_DRUG" as nomfabri,
	dv."NOMBRE_NORMALIZADO_VACUNA" as nomcomv,
	dv."NUMERO_LOTE" as numlote,
	dv."NUMERO_DOSIS_VACUNA" as dosis,
	tdv."FECHA_VACUNACION" as fvacunac
from
	dhi_esavi."TR_NOTIFICACION" tn
inner join dhi_esavi."TR_DATO_VACUNA" dv on
	dv."NOTIFICACION_ID" = tn."ID"
inner join dhi_esavi."TR_DATO_VACUNACION" tdv on
	tdv."NOTIFICACION_ID" = tn."ID"
where
	-- dv."NOMBRE_FABRICANTE" is not null
	-- and dv."NOMBRE_NORMALIZADO_VACUNA" is not null
	tdv."FECHA_VACUNACION" is not null
	]"

# Ejecutar la consulta
reg_vaccines <- consultar_postgres(query_df_vaccine)
# Guardar el resultado en archivo RDS
if (!is.null(reg_vaccines)) {
  saveRDS(reg_vaccines, file.path(base_rds_path, "db_reg_vaccine.rds"))
  message("Datos guardados en db_reg_vaccine.rds")
} else {
  message("No se pudieron obtener los datos")
}


query_outcome <- r"[
select
	tge."ID" as id,
	tge."NOTIFICACION_ID" as report_id ,
	case
		when tge."MUERTE" = true then 1
		when tge."RIESGO_VIDA" = true then 2
		when tge."DISCAPACIDAD" = true then 3
		when tge."ANOMALIA_CONGENITA" = true then 4
		when tge."HOSPITALIZACION" = true then 5
		else 0
	end as desenesv,
	tge."MUERTE"::int as mueresav,
	case
		when tge."TIPO_GRAVEDAD" = '1' then 1
		when tge."TIPO_GRAVEDAD" = '0' then 0
	end as gravesav
from
	dhi_esavi."TR_NOTIFICACION" tn
inner join dhi_esavi."TR_GRAVEDAD_ESAVI" tge on
	tge."NOTIFICACION_ID" = tn."ID"
inner join dhi_esavi."TR_DATOS_ESAVI" tde on
	tde."NOTIFICACION_ID" = tn."ID"
where
	tge."TIPO_GRAVEDAD" is not null
  
  ]"
# Ejecutar la consulta
df_reg_seriousness_outcom <- consultar_postgres(query_outcome)
# Guardar el resultado en archivo RDS
if (!is.null(df_reg_seriousness_outcom)) {
  saveRDS(df_reg_seriousness_outcom, file.path(base_rds_path, "db_reg_seriousness_outcome.rds"))
  message("Datos guardados en db_reg_seriousness_outcome.rds")
} else {
  message("No se pudieron obtener los datos")
}


query_dosis_admin <- r"[
select 
    tv."FECHA_APLICACION" AS fecha_sem_epi,
	EXTRACT(WEEK FROM tv."FECHA_APLICACION") AS sem_epi,
    tv."GRUPO_ETARIO" AS grupo_etario,
    v.sexo as sexo,
    CASE
        WHEN v.sexo = 'Hombre' THEN tv."TOTAL_HOMBRES"
        ELSE tv."TOTAL_MUJERES"
    END AS "NumDosis"
FROM
    dhi_esavi."TR_VACUNOMETRO" tv
CROSS JOIN (
    SELECT 'Hombre' AS sexo
    UNION ALL
    SELECT 'Mujer'
) v 
]"
df_dosis_admin <- consultar_postgres(query_dosis_admin)
# Guardar el resultado en archivo RDS
if (!is.null(df_dosis_admin)) {
    saveRDS(df_dosis_admin, file.path(base_rds_path, "dosis_administradas.rds"))
    message("Datos guardados en dosis_administradas_.rds")
} else {
    message("No se pudieron obtener los datos")
}


query_embarazadas = r"[
select
	tpe."ID" as id,
	tn."ID" as report_id,
	1 as embesavi
from
	dhi_esavi."TR_NOTIFICACION" tn
inner join dhi_esavi."TR_PACIENTE_EMBARAZADA" tpe on
	tn."ID" = tpe."NOTIFICACION_ID"
]"

df_embarazadas <- consultar_postgres(query_embarazadas)
# Guardar el resultado en archivo RDS
if (!is.null(df_embarazadas)) {
  saveRDS(df_embarazadas, file.path(base_rds_path, "db_reg_pregnancy.rds"))
  message("Datos guardados en db_reg_pregnancy.rds")
} else {
  message("No se pudieron obtener los datos")
}