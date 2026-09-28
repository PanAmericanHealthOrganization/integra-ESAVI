#!/bin/bash
# ./postgres/init-scripts/01-restore.sh

set -e  # Detener el script si hay error

echo "========================================="
echo "Iniciando restauración de base de datos"
echo "========================================="

# Esperar a que PostgreSQL esté completamente iniciado
echo "Esperando que PostgreSQL esté listo..."
# until psql -U ${POSTGRES_USER} -d postgres; do
#     echo "PostgreSQL no está listo aún, esperando 2 segundos..."
#     sleep 2
# done

echo "PostgreSQL está listo, continuando..."

# Las variables de entorno están disponibles automáticamente
# POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB

# 1. Eliminar la base de datos si existe
echo "Eliminando base de datos '${POSTGRES_DB}' si existe..."
psql -U ${POSTGRES_USER} -d postgres -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"


# 2. Crear nueva base de datos
echo "Creando base de datos '${POSTGRES_DB}'..."
psql -U ${POSTGRES_USER} -d postgres -c "CREATE DATABASE ${POSTGRES_DB};"

# 3. Verificar que el archivo de backup existe
if [ -f /${POSTGRES_FILE} ]; then
    echo "Archivo de backup encontrado, iniciando restauración..."    
    # 4. Restaurar el backup
    echo "Restaurando backup en la base de datos '${POSTGRES_DB}'..."
    psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -v -a -f ${POSTGRES_FILE}
    
    
    echo "========================================="
    echo "Restauración completada exitosamente"
    echo "========================================="
else
    echo "Advertencia: No se encontró el archivo backup SQL"
    echo "La base de datos fue creada pero está vacía"
fi