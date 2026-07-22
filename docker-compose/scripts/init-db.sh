#!/bin/bash
set -e

PSQL="psql -h postgres -U dhis"

echo "==> Creando base de datos DHI_ESAVI (si no existe)..."
# Conectarse a 'postgres' porque DHI_ESAVI puede no existir todavía.
# Comillas dobles para respetar las mayúsculas del nombre.
if ! $PSQL -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'DHI_ESAVI';" | grep -q 1; then
  $PSQL -d postgres -c 'CREATE DATABASE "DHI_ESAVI";'
else
  echo "    la BD DHI_ESAVI ya existe"
fi

echo "==> Creando esquemas en DHI_ESAVI..."
$PSQL -d DHI_ESAVI -c 'CREATE SCHEMA IF NOT EXISTS "DHI_ESAVI";'
$PSQL -d DHI_ESAVI -c 'CREATE SCHEMA IF NOT EXISTS "WHO_DRUG";'
$PSQL -d DHI_ESAVI -c 'CREATE SCHEMA IF NOT EXISTS "MEDDRA";'
$PSQL -d DHI_ESAVI -c 'CREATE SCHEMA IF NOT EXISTS "POSTGRES_INTEGRATOR_DS";'
$PSQL -d DHI_ESAVI -c 'CREATE SCHEMA IF NOT EXISTS "DATAQUALITY_DS";'

echo "==> Creando usuario y BD keycloak..."
$PSQL -d postgres -c "DO \$\$ BEGIN
  CREATE USER keycloak WITH PASSWORD 'password123';
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'usuario keycloak ya existe';
END \$\$;"
createdb -h postgres -U dhis -O keycloak keycloak || true

echo "==> Inicialización completada."
