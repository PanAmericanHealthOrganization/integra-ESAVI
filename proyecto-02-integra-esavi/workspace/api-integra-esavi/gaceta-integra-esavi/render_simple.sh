#!/bin/bash

# Script para renderizar informe ESAVI con parámetros de fecha
# Uso: ./render_simple.sh [formato] [fecha_desde] [fecha_hasta]
# Ejemplo: ./render_simple.sh pdf 2025-11-01 2025-11-30

# Función para mostrar ayuda
mostrar_ayuda() {
    echo "📋 Uso: ./render_simple.sh [formato] [fecha_desde] [fecha_hasta]"
    echo ""
    echo "Parámetros:"
    echo "  formato      : pdf, html, word, all (por defecto: pdf)"
    echo "  fecha_desde  : Fecha de inicio en formato YYYY-MM-DD (por defecto: primer día del mes actual)"
    echo "  fecha_hasta  : Fecha de fin en formato YYYY-MM-DD (por defecto: último día del mes actual)"
    echo ""
    echo "Ejemplos:"
    echo "  ./render_simple.sh                           # PDF del mes actual"
    echo "  ./render_simple.sh pdf 2025-11-01 2025-11-30 # PDF de noviembre 2025"
    echo "  ./render_simple.sh html 2025-10-15 2025-11-15 # HTML del 15/oct al 15/nov"
    echo "  ./render_simple.sh all 2025-10-01 2025-10-31  # PDF, HTML y Word del período"
    echo "  ./render_simple.sh --help                    # Mostrar esta ayuda"
}

# Verificar si se solicita ayuda
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    mostrar_ayuda
    exit 0
fi

# Configuración básica
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAW_FORMATO=${1:-pdf}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/render_simple_${TIMESTAMP}.log"

# Limpiar formato (quitar guiones si los hay)
FORMATO=$(echo "$RAW_FORMATO" | sed 's/^--//')

# Configurar fechas por defecto (primer y último día del mes actual) - Compatible macOS
ANIO_ACTUAL=$(date +"%Y")
MES_ACTUAL_NUM=$(date +"%m")
MES_ACTUAL=$(date +"%Y-%m")
PRIMER_DIA="${MES_ACTUAL}-01"

# Calcular último día del mes de forma simple
case $MES_ACTUAL_NUM in
    01|03|05|07|08|10|12) ULTIMO_DIA="${MES_ACTUAL}-31" ;;
    04|06|09|11) ULTIMO_DIA="${MES_ACTUAL}-30" ;;
    02) 
        # Para febrero, usar 28 (simplificado, no considera años bisiestos)
        ULTIMO_DIA="${MES_ACTUAL}-28" 
        ;;
esac

# Obtener parámetros de fecha
FECHA_DESDE=${2:-$PRIMER_DIA}
FECHA_HASTA=${3:-$ULTIMO_DIA}

# Función para validar fechas compatible con macOS y Linux
validar_fecha() {
    local fecha=$1
    if [[ ! $fecha =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
        echo "❌ Error: Fecha '$fecha' no tiene formato válido (YYYY-MM-DD)"
        exit 1
    fi
    
    # Extraer componentes de la fecha
    local anio=$(echo $fecha | cut -d'-' -f1)
    local mes=$(echo $fecha | cut -d'-' -f2 | sed 's/^0*//')  # Remover ceros al inicio
    local dia=$(echo $fecha | cut -d'-' -f3 | sed 's/^0*//')  # Remover ceros al inicio
    
    # Validar rangos básicos
    if [[ $mes -lt 1 || $mes -gt 12 ]]; then
        echo "❌ Error: Mes inválido en fecha '$fecha' (debe estar entre 01-12)"
        exit 1
    fi
    
    if [[ $dia -lt 1 || $dia -gt 31 ]]; then
        echo "❌ Error: Día inválido en fecha '$fecha' (debe estar entre 01-31)"
        exit 1
    fi
    
    # Validación básica de días por mes (sin considerar años bisiestos para simplificar)
    case $mes in
        4|6|9|11) # Abril, Junio, Septiembre, Noviembre (30 días)
            if [[ $dia -gt 30 ]]; then
                echo "❌ Error: El mes $mes solo tiene 30 días, fecha '$fecha' inválida"
                exit 1
            fi
            ;;
        2) # Febrero
            if [[ $dia -gt 29 ]]; then
                echo "❌ Error: Febrero no puede tener más de 29 días, fecha '$fecha' inválida"
                exit 1
            fi
            ;;
    esac
}

validar_fecha "$FECHA_DESDE"
validar_fecha "$FECHA_HASTA"

# Validar que fecha_desde <= fecha_hasta
if [[ "$FECHA_DESDE" > "$FECHA_HASTA" ]]; then
    echo "❌ Error: La fecha de inicio ($FECHA_DESDE) debe ser anterior o igual a la fecha de fin ($FECHA_HASTA)"
    exit 1
fi

# Extraer año y mes para nombres de archivo (basado en fecha_hasta) - Compatible macOS
ANIO_INFORME=$(echo "$FECHA_HASTA" | cut -d'-' -f1)
MES_INFORME=$(echo "$FECHA_HASTA" | cut -d'-' -f2)
FECHA_ARCHIVO="${ANIO_INFORME}${MES_INFORME}"

echo "🔄 Renderizando informe ESAVI en formato $FORMATO..."
echo "📁 Directorio: $SCRIPT_DIR"
echo "📅 Período: $FECHA_DESDE al $FECHA_HASTA"
echo "📋 Código del informe: $FECHA_ARCHIVO"

# Crear estructura de directorios por año y mes
OUTPUT_DIR_MENSUAL="$SCRIPT_DIR/output/$ANIO_INFORME/$MES_INFORME"
mkdir -p "$OUTPUT_DIR_MENSUAL"
mkdir -p "$SCRIPT_DIR/output/figuras"
mkdir -p "$LOG_DIR"

# Función para logging
log_mensaje() {
    local mensaje="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $mensaje" >> "$LOG_FILE"
    echo "$mensaje"
}

log_mensaje "📁 Directorio de salida para este mes: $OUTPUT_DIR_MENSUAL"

# Limpiar cache de R Markdown para el archivo actual
log_mensaje "🧹 Limpiando cache de R Markdown para regenerar figuras..."
if [[ -d "$SCRIPT_DIR/informe_cache" ]]; then
    rm -rf "$SCRIPT_DIR/informe_cache"
    log_mensaje "✅ Cache de R Markdown eliminado"
fi

# Limpiar logs antiguos de la raíz y moverlos al directorio logs
log_mensaje "🧹 Organizando archivos de log..."
if ls "$SCRIPT_DIR"/informe_esavi_*.log 1> /dev/null 2>&1; then
    mv "$SCRIPT_DIR"/informe_esavi_*.log "$LOG_DIR/" 2>/dev/null || true
    log_mensaje "✅ Logs movidos al directorio logs/"
fi

# Comando R para renderizar
log_mensaje "🚀 Iniciando proceso de renderizado..."

# Determinar formatos a generar
if [[ "$FORMATO" == "all" ]]; then
    FORMATOS_GENERAR=("pdf" "html" "word")
    log_mensaje "📋 Generando todos los formatos: PDF, HTML y Word"
else
    FORMATOS_GENERAR=("$FORMATO")
    log_mensaje "📋 Generando formato: $FORMATO"
fi

R --no-restore --no-save --quiet << EOF
library(rmarkdown)
setwd('$SCRIPT_DIR')

# Configurar variables de entorno con los parámetros de fecha
Sys.setenv(
    FECHA_DESDE_INFORME = '$FECHA_DESDE',
    FECHA_HASTA_INFORME = '$FECHA_HASTA',
    ANIO_INFORME_PARAM = '$ANIO_INFORME',
    MES_INFORME_PARAM = '$MES_INFORME',
    OUTPUT_DIR_MENSUAL = '$OUTPUT_DIR_MENSUAL'
)

# Definir formatos a generar
formatos <- c($(printf '"%s",' "${FORMATOS_GENERAR[@]}" | sed 's/,$//' ))

cat('📊 Parámetros del informe:\n')
cat('   Fecha desde: $FECHA_DESDE\n')
cat('   Fecha hasta: $FECHA_HASTA\n')
cat('   Año: $ANIO_INFORME\n')
cat('   Mes: $MES_INFORME\n')
cat('   Formatos: ', paste(formatos, collapse=', '), '\n\n')

# Renderizar cada formato
archivos_generados <- c()
for (formato in formatos) {
    tryCatch({
        # Determinar extensión de archivo
        extension <- ifelse(formato == 'word', 'docx', formato)
        output_file <- paste0('output/$ANIO_INFORME/$MES_INFORME/informe_esavi_${FECHA_ARCHIVO}.', extension)
        
        # Determinar formato de salida
        output_format <- switch(formato,
                               'pdf' = 'pdf_document',
                               'html' = 'html_document', 
                               'word' = 'word_document',
                               'pdf_document')
        
        cat('� Generando', toupper(formato), '...\n')
        
        render('informe.Rmd', 
               output_format = output_format,
               output_file = output_file,
               params = list(
                   fecha_desde = '$FECHA_DESDE',
                   fecha_hasta = '$FECHA_HASTA',
                   anio_informe = as.integer($ANIO_INFORME),
                   mes_informe = as.integer($MES_INFORME)
               ))
               
        archivos_generados <- c(archivos_generados, output_file)
        cat('✅', toupper(formato), 'generado exitosamente:', output_file, '\n')
        
    }, error = function(e) {
        cat('❌ Error generando', toupper(formato), ':', conditionMessage(e), '\n')
    })
}

cat('\n📄 Resumen de archivos generados:\n')
for (archivo in archivos_generados) {
    cat('   -', archivo, '\n')
}

# Nota: Apertura automática de archivos deshabilitada por preferencia del usuario
# if (length(formatos) == 1 && length(archivos_generados) > 0 && Sys.info()['sysname'] == 'Darwin') {
#     system(paste('open', shQuote(archivos_generados[1])))
# }
EOF

if [ $? -eq 0 ]; then
    log_mensaje "✅ Proceso completado exitosamente"
    if [[ "$FORMATO" == "all" ]]; then
        log_mensaje "📄 Archivos generados en: output/$ANIO_INFORME/$MES_INFORME/ (PDF, HTML, Word)"
    else
        log_mensaje "📄 Archivo $FORMATO generado en: output/$ANIO_INFORME/$MES_INFORME/"
    fi
    log_mensaje "📊 Figuras organizadas en: output/$ANIO_INFORME/$MES_INFORME/figuras_informe_esavi_${FECHA_ARCHIVO}/"
    
    # Mover cualquier log generado durante el proceso al directorio logs
    if ls "$SCRIPT_DIR"/informe_esavi_*.log 1> /dev/null 2>&1; then
        mv "$SCRIPT_DIR"/informe_esavi_*.log "$LOG_DIR/" 2>/dev/null || true
        log_mensaje "📝 Logs adicionales movidos al directorio logs/"
    fi
    
    echo "📝 Log guardado en: $LOG_FILE"
else
    log_mensaje "❌ Error en el proceso de renderizado"
    
    # Mover logs de error también
    if ls "$SCRIPT_DIR"/informe_esavi_*.log 1> /dev/null 2>&1; then
        mv "$SCRIPT_DIR"/informe_esavi_*.log "$LOG_DIR/" 2>/dev/null || true
        log_mensaje "📝 Logs de error movidos al directorio logs/"
    fi
    
    echo "📝 Log con errores en: $LOG_FILE"
    exit 1
fi