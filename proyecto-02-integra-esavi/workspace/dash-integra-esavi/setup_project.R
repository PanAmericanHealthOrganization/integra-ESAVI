#!/usr/bin/env Rscript

# setup_project.R
# Script para inicializar renv e instalar dependencias desde cero

cat("=== INICIANDO CONFIGURACIÓN DEL PROYECTO ===\n\n")

# 1. Instalar renv si no existe
if (!requireNamespace("renv", quietly = TRUE)) {
  cat("Instalando paquete renv...\n")
  install.packages("renv", repos = "https://cloud.r-project.org")
}

# 2. Inicializar un proyecto renv nuevo (bare = TRUE para evitar escaneo automático lento/fallido inicial)
# force = TRUE para sobrescribir si quedó algo a medias
cat("Inicializando entorno virtual renv...\n")
renv::init(bare = TRUE, force = TRUE, restart = FALSE)

# 3. Activar el entorno (por seguridad, aunque init lo hace)
cat("Activando entorno...\n")
renv::activate()

# 4. Instalar dependencias usando el script existente
cat("\n--- Ejecutando instalar_dependencias.R ---\n")
source("instalar_dependencias.R")

# 5. Generar snapshot para crear renv.lock
cat("\n--- Generando renv.lock ---\n")
renv::snapshot(type = "all", prompt = FALSE)

cat("\n=== CONFIGURACIÓN COMPLETADA ===\n")
cat("El entorno ha sido configurado y las dependencias instaladas.\n")
