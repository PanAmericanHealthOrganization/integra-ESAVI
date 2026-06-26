#!/usr/bin/env Rscript

# ---------------------------------------------------------------------------- -
# Script: instalar_dependencias.R ----
# Descripcion: Script para instalar todas las dependencias del Dashboard ESAVI
# Uso: source("instalar_dependencias.R") o Rscript instalar_dependencias.R
# ---------------------------------------------------------------------------- -

cat("=== INSTALACIÓN DE DEPENDENCIAS - DASHBOARD ESAVI ===\n\n")

# ---------------------------------------------------------------------------- -
# 1. Configuración inicial ----
# ---------------------------------------------------------------------------- -

# Configurar repositorios CRAN
options(repos = c(CRAN = "https://cloud.r-project.org/"))

# Verificar versión de R
r_version <- R.Version()
cat("Versión de R:", r_version$version.string, "\n")

if (as.numeric(r_version$major) < 4) {
    warning("Se recomienda R versión 4.0 o superior para mejor compatibilidad")
}

# ---------------------------------------------------------------------------- -
# 2. Lista de paquetes requeridos ----
# ---------------------------------------------------------------------------- -

# Paquetes principales de Shiny
shiny_packages <- c(
    "shiny",
    "shinydashboard",
    "shinydashboardPlus",
    "shinyWidgets",
    "shinyjs",
    "DBI",
    "RPostgres"
)

# Paquetes de manipulación de datos
data_packages <- c(
    "dplyr",
    "data.table",
    "purrr",
    "lubridate",
    "stringr",
    "tibble"
)

# Paquetes de visualización
viz_packages <- c(
    "ggplot2",
    "ggthemes",
    "highcharter",
    "leaflet",
    "leaflet.extras",
    "DT",
    "wordcloud",
    "patchwork",
    "cowplot",
    "RColorBrewer",
    "paletteer"
)

# Paquetes de análisis espacial
spatial_packages <- c(
    "sf"
)

# Paquetes de utilidades
utility_packages <- c(
    "htmltools",
    "htmlwidgets",
    "waiter",
    "fresh",
    "rstudioapi",
    "ragg",
    "flextable",
    "TTR",
    "MCMCpack"
)

# Combinar todos los paquetes CRAN
cran_packages <- c(
    shiny_packages,
    data_packages,
    spatial_packages,
    viz_packages,
    utility_packages
)

# Paquetes de Bioconductor
bioc_packages <- c(
    "LBE",
    "PhViD"
)

# ---------------------------------------------------------------------------- -
# 3. Funciones auxiliares ----
# ---------------------------------------------------------------------------- -

# Función para instalar paquetes CRAN
instalar_cran <- function(paquetes) {
    cat("\n--- Instalando paquetes CRAN ---\n")

    for (paquete in paquetes) {
        cat("Verificando:", paquete, "... ")

        if (!requireNamespace(paquete, quietly = TRUE)) {
            cat("Instalando\n")
            tryCatch(
                {
                    install.packages(paquete, dependencies = TRUE, quiet = TRUE)
                    cat("✓", paquete, "instalado correctamente\n")
                },
                error = function(e) {
                    cat("✗ Error instalando", paquete, ":", conditionMessage(e), "\n")
                }
            )
        } else {
            cat("Ya instalado ✓\n")
        }
    }
}

# Función para instalar paquetes Bioconductor
instalar_bioconductor <- function(paquetes) {
    cat("\n--- Instalando paquetes Bioconductor ---\n")

    # Instalar BiocManager si no está disponible
    if (!requireNamespace("BiocManager", quietly = TRUE)) {
        cat("Instalando BiocManager...\n")
        install.packages("BiocManager", quiet = TRUE)
    }

    for (paquete in paquetes) {
        cat("Verificando:", paquete, "... ")

        if (!requireNamespace(paquete, quietly = TRUE)) {
            cat("Instalando\n")
            # Instalación local para PhViD si existe el archivo
            if (paquete == "PhViD" && file.exists("./library/PhViD_1.0.8.tar.gz")) {
                tryCatch(
                    {
                        install.packages("./library/PhViD_1.0.8.tar.gz", repos = NULL, type = "source")
                        cat("✓", paquete, "instalado localmente\n")
                    },
                    error = function(e) {
                        cat("✗ Error instalando localmente", paquete, ":", conditionMessage(e), "\n")
                    }
                )
            } else {
                tryCatch(
                    {
                        BiocManager::install(paquete, update = FALSE, ask = FALSE)
                        cat("✓", paquete, "instalado correctamente\n")
                    },
                    error = function(e) {
                        cat("✗ Error instalando", paquete, ":", conditionMessage(e), "\n")
                    }
                )
            }
        } else {
            cat("Ya instalado ✓\n")
        }
    }
}

# Función para verificar instalación
verificar_instalacion <- function(paquetes) {
    cat("\n--- Verificando instalación ---\n")

    paquetes_faltantes <- c()

    for (paquete in paquetes) {
        if (requireNamespace(paquete, quietly = TRUE)) {
            cat("✓", paquete, "\n")
        } else {
            cat("✗", paquete, "NO DISPONIBLE\n")
            paquetes_faltantes <- c(paquetes_faltantes, paquete)
        }
    }

    return(paquetes_faltantes)
}

# ---------------------------------------------------------------------------- -
# 4. Proceso de instalación ----
# ---------------------------------------------------------------------------- -

cat(
    "Iniciando instalación de", length(cran_packages), "paquetes CRAN y",
    length(bioc_packages), "paquetes Bioconductor...\n"
)

# Instalar paquetes CRAN
instalar_cran(cran_packages)

# Instalar paquetes Bioconductor
instalar_bioconductor(bioc_packages)

# ---------------------------------------------------------------------------- -
# 5. Verificación final ----
# ---------------------------------------------------------------------------- -

todos_los_paquetes <- c(cran_packages, bioc_packages)
paquetes_faltantes <- verificar_instalacion(todos_los_paquetes)

cat("\n=== RESUMEN DE INSTALACIÓN ===\n")
cat("Total de paquetes requeridos:", length(todos_los_paquetes), "\n")
cat("Paquetes instalados correctamente:", length(todos_los_paquetes) - length(paquetes_faltantes), "\n")
cat("Paquetes faltantes:", length(paquetes_faltantes), "\n")

if (length(paquetes_faltantes) > 0) {
    cat("\n⚠️  Los siguientes paquetes no pudieron instalarse:\n")
    for (paquete in paquetes_faltantes) {
        cat("   -", paquete, "\n")
    }
    cat("\nIntenta instalarlos manualmente:\n")
    cat("install.packages(c(", paste0('"', paquetes_faltantes, '"', collapse = ", "), "))\n")
} else {
    cat("\n✅ ¡Todas las dependencias se instalaron correctamente!\n")
    cat("Ahora puedes ejecutar el dashboard con:\n")
    cat("   source('ejecutar_dashboard.R')\n")
    cat("   # o\n")
    cat("   Rscript run.R\n")
}

cat("\n=== FIN DE LA INSTALACIÓN ===\n")


