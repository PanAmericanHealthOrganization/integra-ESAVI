#!/bin/bash

# ---------------------------------------------------------------------------- -
# Script: ejecutar_dashboard.sh
# Descripcion: Script de shell para ejecutar el Dashboard ESAVI en macOS/Linux
# Uso: ./ejecutar_dashboard.sh
# ---------------------------------------------------------------------------- -

echo "==================================="
echo "   DASHBOARD ESAVI - EJECUTOR"
echo "==================================="
echo

# Verificar si R está instalado
if ! command -v Rscript &> /dev/null; then
    echo "ERROR: R no está instalado o no está en el PATH del sistema"
    echo "Por favor instala R desde: https://cran.r-project.org/"
    echo "En macOS puedes usar: brew install r"
    echo "En Ubuntu/Debian: sudo apt-get install r-base"
    exit 1
fi

echo "R encontrado, ejecutando dashboard..."
echo

# Cambiar al directorio del script
cd "$(dirname "$0")"

# Verificar archivos esenciales
if [ ! -f "run.R" ]; then
    echo "ERROR: No se encuentra el archivo run.R"
    exit 1
fi

if [ ! -f "global.R" ] || [ ! -f "ui.R" ] || [ ! -f "server.R" ]; then
    echo "ERROR: Faltan archivos esenciales de la aplicación Shiny"
    exit 1
fi

# Hacer el script ejecutable si no lo es
chmod +x "$0"

# Ejecutar el dashboard
echo "Iniciando dashboard en http://localhost:80"
echo "Presiona Ctrl+C para detener la aplicación"
echo

Rscript app.R

# Verificar si hubo errores
if [ $? -ne 0 ]; then
    echo
    echo "ERROR: Hubo un problema ejecutando el dashboard"
    echo "Revisa los mensajes anteriores para más detalles"
    echo
    echo "Posibles soluciones:"
    echo "1. Ejecutar primero: Rscript instalar_dependencias.R"
    echo "2. Verificar que los archivos de datos estén en la carpeta 'datos/'"
    echo "3. Si ves un error de 'renv', revisa el archivo .Rprofile"
    echo "4. Revisar permisos de archivos"
fi


