# ── Imagen de APLICACIÓN del dashboard ────────────────────────────────────────
# Parte de la imagen base (Dockerfile.deps), que ya trae las librerías del
# sistema y todos los paquetes R restaurados con renv. Aquí solo se copia el
# código, por lo que el build tarda segundos.
#
# La base debe existir antes de construir esta imagen:
#   docker-compose/scripts/build-dash-base.sh
#
# El prefijo localhost/ es obligatorio en podman: sin él, la resolución de
# nombres cortos intenta buscar la imagen en un registro remoto.
ARG BASE_IMAGE=localhost/integra-esavi/dash-base:4.4.1
FROM ${BASE_IMAGE}

WORKDIR /app

# ── Código de la aplicación ────────────────────────────────────────────────────
# preparar_datos.R no se copia: es el pipeline R retirado (lo reemplazó el
# módulo datamart del API) y su RPostgres ya no está instalado en la base.
COPY run.R            run.R
COPY global.R         global.R
COPY ui.R             ui.R
COPY server.R         server.R
COPY scripts/         scripts/
COPY www/             www/

RUN mkdir -p datos fuente_de_datos logs

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -sf http://localhost:80/ || exit 1

CMD ["Rscript", "run.R"]
