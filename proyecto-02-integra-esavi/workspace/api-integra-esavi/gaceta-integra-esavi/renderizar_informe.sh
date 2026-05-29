#!/bin/bash

# Script para renderizar el informe ESAVI en R Markdown
# Autor: Equipo ESAVI
# Fecha: 4 de noviembre de 2025
# Uso: ./renderizar_informe.sh [formato] [opciones]

# Configuración de colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración de variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFORME_RMD="$SCRIPT_DIR/informe.Rmd"
OUTPUT_DIR="$SCRIPT_DIR/output"
LOG_DIR="$SCRIPT_DIR/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Función para mostrar ayuda
mostrar_ayuda() {
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${BLUE}     SCRIPT DE RENDERIZADO - INFORME ESAVI    ${NC}"
    echo -e "${BLUE}===============================================${NC}"
    echo ""
    echo -e "${YELLOW}USO:${NC}"
    echo "  $0 [formato] [opciones]"
    echo ""
    echo -e "${YELLOW}FORMATOS DISPONIBLES:${NC}"
    echo "  pdf        - Genera informe en formato PDF"
    echo "  html       - Genera informe en formato HTML"
    echo "  word       - Genera informe en formato Word"
    echo "  todos      - Genera todos los formatos"
    echo ""
    echo -e "${YELLOW}OPCIONES:${NC}"
    echo "  -v, --verbose    - Modo verbose (más detalles)"
    echo "  -l, --log        - Guarda log detallado"
    echo "  -o, --open       - Abre el archivo generado automáticamente"
    echo "  -c, --clean      - Limpia archivos temporales antes de renderizar"
    echo "  -h, --help       - Muestra esta ayuda"
    echo ""
    echo -e "${YELLOW}EJEMPLOS:${NC}"
    echo "  $0 pdf"
    echo "  $0 html --verbose --open"
    echo "  $0 todos --log"
    echo ""
}

# Función para mostrar mensajes con timestamp
log_mensaje() {
    local nivel=$1
    local mensaje=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $nivel in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} [$timestamp] $mensaje"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} [$timestamp] $mensaje"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} [$timestamp] $mensaje"
            ;;
        "DEBUG")
            if [[ $VERBOSE == true ]]; then
                echo -e "${BLUE}[DEBUG]${NC} [$timestamp] $mensaje"
            fi
            ;;
    esac
    
    # Guardar en log si está activado
    if [[ $SAVE_LOG == true ]]; then
        echo "[$nivel] [$timestamp] $mensaje" >> "$LOG_FILE"
    else
        # Siempre guardar logs básicos en directorio logs
        local log_basico="$LOG_DIR/renderizado_${TIMESTAMP}.log"
        echo "[$nivel] [$timestamp] $mensaje" >> "$log_basico"
    fi
}

# Función para verificar dependencias
verificar_dependencias() {
    log_mensaje "INFO" "Verificando dependencias..."
    
    # Verificar R
    if ! command -v R &> /dev/null; then
        log_mensaje "ERROR" "R no está instalado o no está en el PATH"
        return 1
    fi
    
    # Verificar pandoc
    if ! command -v pandoc &> /dev/null; then
        log_mensaje "WARN" "Pandoc no encontrado. Intentando usar el de RStudio..."
    fi
    
    # Verificar archivo principal
    if [[ ! -f "$INFORME_RMD" ]]; then
        log_mensaje "ERROR" "Archivo principal no encontrado: $INFORME_RMD"
        return 1
    fi
    
    # Verificar secciones
    local secciones=("portada.Rmd" "indice.Rmd" "desarrollo.Rmd" "conclusiones.Rmd")
    for seccion in "${secciones[@]}"; do
        if [[ ! -f "$SCRIPT_DIR/secciones/$seccion" ]]; then
            log_mensaje "WARN" "Sección no encontrada: secciones/$seccion"
        fi
    done
    
    log_mensaje "INFO" "Verificación de dependencias completada"
    return 0
}

# Función para crear directorios necesarios
crear_directorios() {
    log_mensaje "DEBUG" "Creando directorios necesarios..."
    
    # Crear directorio de salida
    if [[ ! -d "$OUTPUT_DIR" ]]; then
        mkdir -p "$OUTPUT_DIR"
        log_mensaje "INFO" "Directorio de salida creado: $OUTPUT_DIR"
    fi
    
    # Crear directorio de logs si es necesario
    if [[ $SAVE_LOG == true && ! -d "$LOG_DIR" ]]; then
        mkdir -p "$LOG_DIR"
        log_mensaje "INFO" "Directorio de logs creado: $LOG_DIR"
    fi
    
    # Crear directorio de logs por defecto
    if [[ ! -d "$LOG_DIR" ]]; then
        mkdir -p "$LOG_DIR"
        log_mensaje "DEBUG" "Directorio de logs creado: $LOG_DIR"
    fi
}

# Función para limpiar archivos auxiliares en output (excepto PDFs)
limpiar_output_auxiliares() {
    log_mensaje "INFO" "Limpiando archivos auxiliares en directorio output (conservando PDFs)..."
    
    if [[ -d "$OUTPUT_DIR" ]]; then
        # Eliminar archivos auxiliares excepto PDFs
        find "$OUTPUT_DIR" -type f ! -name "*.pdf" -delete 2>/dev/null || true
        # Eliminar directorios auxiliares (como *_files/)
        find "$OUTPUT_DIR" -type d -name "*_files" -exec rm -rf {} + 2>/dev/null || true
        log_mensaje "INFO" "Archivos y directorios auxiliares eliminados del directorio output"
    fi
}

# Función para limpiar archivos temporales
limpiar_temporales() {
    log_mensaje "INFO" "Limpiando archivos temporales..."
    
    # Organizar logs de informe antes de limpiar
    organizar_logs
    
    # Limpiar archivos temporales específicos (excluyendo directorio logs)
    find "$SCRIPT_DIR" -maxdepth 1 -name "*.aux" -type f -delete 2>/dev/null || true
    find "$SCRIPT_DIR" -maxdepth 1 -name "*.tex" -type f -delete 2>/dev/null || true
    find "$SCRIPT_DIR" -maxdepth 1 -name "*.toc" -type f -delete 2>/dev/null || true
    find "$SCRIPT_DIR" -maxdepth 1 -name "*.out" -type f -delete 2>/dev/null || true
    find "$SCRIPT_DIR" -maxdepth 1 -name "*.fls" -type f -delete 2>/dev/null || true
    find "$SCRIPT_DIR" -maxdepth 1 -name "*.fdb_latexmk" -type f -delete 2>/dev/null || true
    
    log_mensaje "INFO" "Limpieza completada"
}

# Función para organizar logs
organizar_logs() {
    log_mensaje "INFO" "Organizando archivos de log..."
    
    # Mover logs de informe al directorio logs
    if ls "$SCRIPT_DIR"/informe_esavi_*.log 1> /dev/null 2>&1; then
        mv "$SCRIPT_DIR"/informe_esavi_*.log "$LOG_DIR/" 2>/dev/null || true
        log_mensaje "INFO" "Logs de informe movidos al directorio logs/"
    fi
}

# Función para renderizar informe
renderizar_informe() {
    local formato=$1
    local output_file=""
    
    case $formato in
        "pdf")
            output_file="$OUTPUT_DIR/informe_esavi_${TIMESTAMP}.pdf"
            ;;
        "html")
            output_file="$OUTPUT_DIR/informe_esavi_${TIMESTAMP}.html"
            ;;
        "word")
            output_file="$OUTPUT_DIR/informe_esavi_${TIMESTAMP}.docx"
            ;;
        *)
            log_mensaje "ERROR" "Formato no reconocido: $formato"
            return 1
            ;;
    esac
    
    log_mensaje "INFO" "Iniciando renderizado en formato $formato..."
    log_mensaje "DEBUG" "Archivo de salida: $output_file"
    
    # Comando R para renderizar
    local r_command="
    library(rmarkdown)
    library(knitr)
    
    # Configurar directorio de trabajo
    setwd('$SCRIPT_DIR')
    
    # Renderizar
    tryCatch({
        render('$INFORME_RMD', 
               output_format = '${formato}_document',
               output_file = '$output_file',
               quiet = $(if [[ $VERBOSE == true ]]; then echo "FALSE"; else echo "TRUE"; fi))
        cat('EXITO: Informe generado exitosamente\n')
    }, error = function(e) {
        cat('ERROR:', conditionMessage(e), '\n')
        quit(status = 1)
    })
    "
    
    # Ejecutar comando R
    if [[ $VERBOSE == true ]]; then
        echo "$r_command" | R --no-restore --no-save
    else
        echo "$r_command" | R --no-restore --no-save --quiet
    fi
    
    local exit_code=$?
    
    if [[ $exit_code -eq 0 ]]; then
        log_mensaje "INFO" "✓ Informe $formato generado exitosamente: $output_file"
        
        # Abrir archivo si se solicitó
        if [[ $OPEN_FILE == true ]]; then
            abrir_archivo "$output_file"
        fi
        
        return 0
    else
        log_mensaje "ERROR" "✗ Error al generar informe $formato"
        return 1
    fi
}

# Función para abrir archivo generado
abrir_archivo() {
    local archivo=$1
    
    if [[ -f "$archivo" ]]; then
        log_mensaje "INFO" "Abriendo archivo: $archivo"
        
        # Detectar sistema operativo y abrir archivo
        case "$(uname -s)" in
            Darwin)
                open "$archivo"
                ;;
            Linux)
                xdg-open "$archivo" 2>/dev/null || true
                ;;
            CYGWIN*|MINGW32*|MSYS*|MINGW*)
                start "$archivo"
                ;;
            *)
                log_mensaje "WARN" "No se pudo determinar cómo abrir el archivo en este sistema"
                ;;
        esac
    else
        log_mensaje "ERROR" "Archivo no encontrado: $archivo"
    fi
}

# Función para mostrar resumen final
mostrar_resumen() {
    echo ""
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${BLUE}              RESUMEN DE EJECUCIÓN            ${NC}"
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${GREEN}Directorio de trabajo:${NC} $SCRIPT_DIR"
    echo -e "${GREEN}Archivos generados en:${NC} $OUTPUT_DIR"
    
    if [[ $SAVE_LOG == true ]]; then
        echo -e "${GREEN}Log guardado en:${NC} $LOG_FILE"
    fi
    
    echo -e "${GREEN}Timestamp:${NC} $TIMESTAMP"
    echo ""
    
    # Listar archivos generados
    if [[ -d "$OUTPUT_DIR" ]]; then
        local archivos_recientes=$(find "$OUTPUT_DIR" -name "*${TIMESTAMP}*" -type f)
        if [[ -n "$archivos_recientes" ]]; then
            echo -e "${YELLOW}Archivos generados:${NC}"
            echo "$archivos_recientes"
        fi
    fi
    echo ""
}

# Función principal
main() {
    # Variables por defecto
    FORMATO=""
    VERBOSE=false
    SAVE_LOG=false
    OPEN_FILE=false
    CLEAN_TEMP=false
    
    # Configurar archivo de log
    if [[ $SAVE_LOG == true ]]; then
        LOG_FILE="$LOG_DIR/renderizado_${TIMESTAMP}.log"
    fi
    
    # Procesar argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            pdf|html|word|todos)
                FORMATO="$1"
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -l|--log)
                SAVE_LOG=true
                LOG_FILE="$LOG_DIR/renderizado_${TIMESTAMP}.log"
                shift
                ;;
            -o|--open)
                OPEN_FILE=true
                shift
                ;;
            -c|--clean)
                CLEAN_TEMP=true
                shift
                ;;
            -h|--help)
                mostrar_ayuda
                exit 0
                ;;
            *)
                log_mensaje "ERROR" "Opción desconocida: $1"
                mostrar_ayuda
                exit 1
                ;;
        esac
    done
    
    # Verificar que se especificó un formato
    if [[ -z "$FORMATO" ]]; then
        log_mensaje "ERROR" "Debe especificar un formato de salida"
        mostrar_ayuda
        exit 1
    fi
    
    # Inicio del proceso
    log_mensaje "INFO" "=== INICIO DEL PROCESO DE RENDERIZADO ==="
    log_mensaje "INFO" "Formato solicitado: $FORMATO"
    
    # Crear directorios necesarios
    crear_directorios
    
    # Limpiar archivos auxiliares en output (excepto PDFs)
    limpiar_output_auxiliares
    
    # Verificar dependencias
    if ! verificar_dependencias; then
        log_mensaje "ERROR" "Verificación de dependencias falló"
        exit 1
    fi
    
    # Limpiar archivos temporales si se solicitó
    if [[ $CLEAN_TEMP == true ]]; then
        limpiar_temporales
    fi
    
    # Renderizar según formato solicitado
    local exit_code=0
    
    case $FORMATO in
        "todos")
            for fmt in pdf html word; do
                if ! renderizar_informe "$fmt"; then
                    exit_code=1
                fi
            done
            ;;
        *)
            if ! renderizar_informe "$FORMATO"; then
                exit_code=1
            fi
            ;;
    esac
    
    # Mostrar resumen
    mostrar_resumen
    
    # Organizar logs finales
    organizar_logs
    
    if [[ $exit_code -eq 0 ]]; then
        log_mensaje "INFO" "=== PROCESO COMPLETADO EXITOSAMENTE ==="
    else
        log_mensaje "ERROR" "=== PROCESO COMPLETADO CON ERRORES ==="
    fi
    
    exit $exit_code
}

# Ejecutar función principal con todos los argumentos
main "$@"