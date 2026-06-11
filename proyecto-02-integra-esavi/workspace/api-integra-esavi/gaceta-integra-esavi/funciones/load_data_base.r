# Cargar librer<U+00ED>as necesarias
library(DBI)
library(RPostgres) # Paquete moderno que soporta SCRAM authentication
library(glue) # Para interpolaci<U+00F3>n segura de SQL
library(dotenv)

# Funci<U+00F3>n para ejecutar consultas de base de datos
execute_db_query <- function(query, params, fetch_results = TRUE) {
    # Cargar variables de entorno desde .env
    load_dot_env()
    # Obtener credenciales desde variables de entorno
    db_host <- Sys.getenv("HOST_DATABASE")
    db_port <- Sys.getenv("PORT_DATABASE")
    db_name <- Sys.getenv("NAME_DATABASE")
    db_user <- Sys.getenv("USER_DATABASE")
    db_password <- Sys.getenv("PASS_DATABASE")

    # Validar que las credenciales est<U+00E9>n disponibles
    if (any(c(db_host, db_port, db_name, db_user, db_password) == "")) {
        stop("Error: Faltan credenciales de base de datos en el archivo .env")
    }

    # Establecer conexi<U+00F3>n usando RPostgres (soporta SCRAM authentication)
    tryCatch(
        {
            con <- dbConnect(RPostgres::Postgres(),
                host = db_host,
                port = as.numeric(db_port),
                dbname = db_name,
                user = db_user,
                password = db_password
            )

            # Ejecutar consulta con par<U+00E1>metros usando glue_sql para interpolaci<U+00F3>n segura
            if (!is.null(params) && length(params) > 0 &&
                is.list(params) && !is.null(names(params)) && all(names(params) != "")) {
                # Usar glue_sql con par<U+00E1>metros nombrados (forma segura y simple)
                query_interpolated <- do.call(
                    glue::glue_sql,
                    c(list(query, .con = con), params)
                )
            } else {
                # Sin par<U+00E1>metros o sin nombres, ejecutar query directamente
                query_interpolated <- query
            }

            if (fetch_results) {
                result <- dbGetQuery(con, query_interpolated)
            } else {
                result <- dbExecute(con, query_interpolated)
            }

            # Cerrar conexi<U+00F3>n
            dbDisconnect(con)

            return(result)
        },
        error = function(e) {
            if (exists("con")) {
                dbDisconnect(con)
            }
            stop(paste("Error en la consulta de base de datos:", e$message))
        }
    )
}

# Definir consulta SQL para ESAVI
# Usando {anio} y {mes} como placeholders para interpolaci<U+00F3>n segura con glue_sql
gaceta <- "
SELECT
    e.id_evento,
    e.fecha_evento,
    e.fecha_vacunacion,
    e.edad,
    e.sexo,
    e.provincia,
    e.tipo_evento,
    e.gravedad,
    e.desenlace,
    e.hospitalizado,
    v.nombre_vacuna,
    v.lote_vacuna,
    v.fabricante,
    c.clasificacion_causalidad
FROM esavi_eventos e
LEFT JOIN vacunas v ON e.id_vacuna = v.id_vacuna
LEFT JOIN causalidad c ON e.id_evento = c.id_evento
WHERE EXTRACT(YEAR FROM e.fecha_evento) = {anio}
  AND EXTRACT(MONTH FROM e.fecha_evento) = {mes}
ORDER BY e.fecha_evento DESC
"

# Obtener par<U+00E1>metros de a<U+00F1>o y mes
anio <- as.numeric(Sys.getenv("ANIO_CONSULTA", "2025"))
mes <- as.numeric(Sys.getenv("MES_CONSULTA", "11"))

# Ejecutar consulta
tryCatch(
    {
        cat("<U+0001F504> Ejecutando consulta de base de datos...\n")
        cat(paste("<U+0001F4C5> Per<U+00ED>odo:", mes, "/", anio, "\n"))

        datos_esavi <- execute_db_query(
            query = gaceta,
            params = list(anio = anio, mes = mes),
            fetch_results = TRUE
        )

        cat(paste("<U+2705> Consulta exitosa. Registros obtenidos:", nrow(datos_esavi), "\n"))

        # Asignar globalmente para uso en otros archivos
        assign("datos_esavi", datos_esavi, envir = .GlobalEnv)
    },
    error = function(e) {
        cat(paste("<U+274C> Error en consulta de base de datos:", e$message, "\n"))
        cat("<U+2139><U+FE0F>  Usando datos de ejemplo...\n")

        # Datos de ejemplo si falla la consulta
        datos_esavi <- data.frame(
            id_evento = 1:10,
            fecha_evento = seq(as.Date("2025-11-01"), by = "day", length.out = 10),
            edad = sample(1:80, 10),
            sexo = sample(c("M", "F"), 10, replace = TRUE),
            provincia = sample(c("Pichincha", "Guayas", "Azuay"), 10, replace = TRUE),
            gravedad = sample(c("Leve", "Moderado", "Grave"), 10, replace = TRUE)
        )

        assign("datos_esavi", datos_esavi, envir = .GlobalEnv)
    }
)
