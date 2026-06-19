#!/bin/bash
java -jar libs/schemaspy-app.jar -t pgsql -dp libs/postgresql-42.7.11.jar -db dhi_esavi -host localhost -port 5433 -s dhi_esavi -u dhis -p dhis -o output
