#!/bin/bash
set -e

PSQL="psql -h postgres -U dhis"

echo "==> Creando esquemas en dhi_esavi..."
$PSQL -d dhi_esavi -c "CREATE SCHEMA IF NOT EXISTS dhi_esavi;"
$PSQL -d dhi_esavi -c "CREATE SCHEMA IF NOT EXISTS who_drug;"
$PSQL -d dhi_esavi -c "CREATE SCHEMA IF NOT EXISTS meddra;"
$PSQL -d dhi_esavi -c 'CREATE SCHEMA IF NOT EXISTS "POSTGRES_INTEGRATOR_DS";'
$PSQL -d dhi_esavi -c 'CREATE SCHEMA IF NOT EXISTS "DATAQUALITY_DS";'

echo "==> Creando usuario y BD keycloak..."
$PSQL -d dhi_esavi -c "DO \$\$ BEGIN
  CREATE USER keycloak WITH PASSWORD 'password123';
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'usuario keycloak ya existe';
END \$\$;"
createdb -h postgres -U dhis -O keycloak keycloak || true

echo "==> Inicialización completada."
