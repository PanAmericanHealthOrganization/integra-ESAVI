#!/bin/bash
set -e

PSQL="psql -h postgres -U dhis"

echo "==> Creando esquema dhi_esavi..."
$PSQL -d dhi_esavi -c "CREATE SCHEMA IF NOT EXISTS dhi_esavi;"

echo "==> Creando usuario keycloak..."
$PSQL -d dhi_esavi -c "DO \$\$ BEGIN
  CREATE USER keycloak WITH PASSWORD 'password123';
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'usuario keycloak ya existe';
END \$\$;"

echo "==> Creando BD keycloak..."
createdb -h postgres -U dhis -O keycloak keycloak || true

echo "==> Creando BD who_drug..."
createdb -h postgres -U dhis -O dhis who_drug || true
$PSQL -d who_drug -c "CREATE SCHEMA IF NOT EXISTS who_drug;"

echo "==> Creando BD meddra..."
createdb -h postgres -U dhis -O dhis meddra || true
$PSQL -d meddra -c "CREATE SCHEMA IF NOT EXISTS meddra;"
$PSQL -d meddra -c "CREATE SCHEMA IF NOT EXISTS who_drug;"

echo "==> Creando BD DATAQUALITY_DS..."
createdb -h postgres -U dhis -O dhis DATAQUALITY_DS || true
$PSQL -d DATAQUALITY_DS -c 'CREATE SCHEMA IF NOT EXISTS "DATAQUALITY_DS";'

echo "==> Creando BD POSTGRES_INTEGRATOR_DS..."
createdb -h postgres -U dhis -O dhis POSTGRES_INTEGRATOR_DS || true
$PSQL -d POSTGRES_INTEGRATOR_DS -c 'CREATE SCHEMA IF NOT EXISTS "POSTGRES_INTEGRATOR_DS";'

echo "==> Inicialización completada."
