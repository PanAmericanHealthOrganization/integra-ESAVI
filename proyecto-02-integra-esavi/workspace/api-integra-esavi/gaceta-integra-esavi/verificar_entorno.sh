#!/bin/bash

# Script de verificación y preparación del entorno
# Verifica dependencias y prepara el entorno antes del renderizado

# Configuración básica
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/verificacion_${TIMESTAMP}.log"

echo "🔍 Verificando entorno para renderizado de informe ESAVI..."

# Crear directorio de logs
mkdir -p "$LOG_DIR"

# Función para logging
log_mensaje() {
    local mensaje="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $mensaje" >> "$LOG_FILE"
    echo "$mensaje"
}

# Verificar R
log_mensaje "📊 Verificando R..."
if command -v R &> /dev/null; then
    R_VERSION=$(R --version | head -n1)
    log_mensaje "✅ $R_VERSION"
else
    log_mensaje "❌ R no está instalado"
    exit 1
fi

# Verificar pandoc
log_mensaje "📝 Verificando Pandoc..."
if command -v pandoc &> /dev/null; then
    PANDOC_VERSION=$(pandoc --version | head -n1)
    log_mensaje "✅ $PANDOC_VERSION"
else
    log_mensaje "⚠️  Pandoc no encontrado, verificando RStudio pandoc..."
    if [ -f "/Applications/RStudio.app/Contents/MacOS/pandoc/pandoc" ]; then
        log_mensaje "✅ Pandoc de RStudio encontrado"
    else
        log_mensaje "❌ Pandoc no disponible"
        exit 1
    fi
fi

# Verificar paquetes de R necesarios
log_mensaje "📦 Verificando paquetes de R..."
R --quiet --no-restore --no-save << 'EOF'
# Paquetes necesarios
packages_needed <- c("rmarkdown", "knitr", "kableExtra", "ggplot2", 
                     "dplyr", "lubridate", "scales", "readr", "tidyr", 
                     "stringr", "gridExtra", "tinytex")

missing_packages <- packages_needed[!packages_needed %in% installed.packages()[,"Package"]]

if (length(missing_packages) > 0) {
    cat("❌ Paquetes faltantes:", paste(missing_packages, collapse = ", "), "\n")
    cat("📥 Instalando paquetes faltantes...\n")
    
    install.packages(missing_packages, repos = "https://cran.rstudio.com/", quiet = TRUE)
    
    # Verificar instalación
    still_missing <- missing_packages[!missing_packages %in% installed.packages()[,"Package"]]
    if (length(still_missing) > 0) {
        cat("❌ Error: No se pudieron instalar:", paste(still_missing, collapse = ", "), "\n")
        quit(status = 1)
    } else {
        cat("✅ Todos los paquetes instalados correctamente\n")
    }
} else {
    cat("✅ Todos los paquetes necesarios están instalados\n")
}

# Verificar tinytex para PDF
if ("tinytex" %in% installed.packages()[,"Package"]) {
    # Verificar si ya hay LaTeX instalado
    if (Sys.which("pdflatex") != "") {
        cat("✅ LaTeX ya está disponible en el sistema\n")
    } else if (!tinytex::is_tinytex()) {
        cat("📥 Intentando instalar TinyTeX para renderizado PDF...\n")
        tryCatch({
            tinytex::install_tinytex()
            cat("✅ TinyTeX instalado\n")
        }, error = function(e) {
            cat("⚠️  TinyTeX no se pudo instalar, pero LaTeX del sistema debería funcionar\n")
        })
    } else {
        cat("✅ TinyTeX ya está instalado\n")
    }
} else {
    cat("⚠️  Paquete tinytex no disponible, verificando LaTeX del sistema...\n")
    if (Sys.which("pdflatex") != "") {
        cat("✅ LaTeX disponible en el sistema\n")
    } else {
        cat("❌ No se encontró LaTeX\n")
    }
}
EOF

if [ $? -ne 0 ]; then
    log_mensaje "❌ Error en la verificación de paquetes de R"
    exit 1
fi

# Verificar estructura de archivos
log_mensaje "📁 Verificando estructura de archivos..."

files_to_check=(
    "informe.Rmd"
    "secciones/portada.Rmd"
    "secciones/resumen_ejecutivo.Rmd"
    "secciones/indice.Rmd"
    "secciones/desarrollo.Rmd"
    "secciones/conclusiones.Rmd"
    "header.tex"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        log_mensaje "✅ $file"
    else
        log_mensaje "❌ $file no encontrado"
        exit 1
    fi
done

# Crear directorios necesarios
log_mensaje "📂 Creando directorios necesarios..."
mkdir -p output
mkdir -p logs
log_mensaje "✅ Directorios creados"

echo ""
log_mensaje "🎉 ¡Entorno verificado y listo para renderizado!"
log_mensaje "💡 Ahora puedes ejecutar:"
log_mensaje "   ./render_simple.sh pdf"
log_mensaje "   o"
log_mensaje "   ./renderizar_informe.sh pdf --verbose"
echo "📝 Log de verificación guardado en: $LOG_FILE"