
#!/usr/bin/env Rscript

# Activar renv para gestionar dependencias
if (requireNamespace("renv", quietly = TRUE)) {
  renv::activate()
} else {
  message("El paquete 'renv' no está instalado. Instálalo para gestionar dependencias.")
}

# ---------------------------------------------------------------------------- -
# Script: run.R ----
# Descripcion: Script simple para ejecutar el Dashboard de ESAVI desde terminal
# Uso: Rscript run.R
# ---------------------------------------------------------------------------- -

# Configurar directorio de trabajo
if (!interactive()) {
    # Si se ejecuta desde terminal, usar el directorio del script
    script_path <- commandArgs(trailingOnly = FALSE)
    script_path <- script_path[grep("--file=", script_path)]
    if (length(script_path) > 0) {
        script_dir <- dirname(sub("--file=", "", script_path))
        setwd(script_dir)
    }
}

cat("Dashboard ESAVI - Iniciando aplicación...\n")
cat("Directorio de trabajo:", getwd(), "\n")

# Verificar archivos esenciales
archivos_esenciales <- c("global.R", "ui.R", "server.R")
for (archivo in archivos_esenciales) {
    if (!file.exists(archivo)) {
        stop("Error: No se encuentra el archivo ", archivo)
    }
}

# Cargar Shiny
if (!requireNamespace("shiny", quietly = TRUE)) {
    cat("Instalando Shiny...\n")
    install.packages("shiny")
}

library(shiny)

# Configurar y ejecutar aplicación
options(
    shiny.host = "0.0.0.0",
    shiny.port = 80,
    shiny.launch.browser = TRUE
)

cat("Ejecutando aplicación en http://localhost:3838\n")
cat("Presiona Ctrl+C para detener la aplicación\n")

runApp(
    appDir = getwd(),
    host = "0.0.0.0",
    port = 80,
    launch.browser = FALSE
)
