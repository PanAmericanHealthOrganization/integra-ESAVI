FROM rocker/r-ver:4.4.1

# ── Sistema operativo: dependencias de paquetes R con librerías nativas ────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    # RPostgres
    libpq-dev \
    # Cairo (renderizado gráfico)
    libcairo2-dev \
    libxt-dev \
    # sf / leaflet (datos geoespaciales)
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    libudunits2-dev \
    # openssl / httr / curl
    libssl-dev \
    libcurl4-openssl-dev \
    # xml2
    libxml2-dev \
    # systemfonts / textshaping (highcharter, flextable)
    libfontconfig1-dev \
    libfreetype6-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    # RMariaDB (dependencia transitiva)
    libmariadb-dev-compat \
    # utilidades de red para healthcheck
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── Directorio de trabajo ──────────────────────────────────────────────────────
WORKDIR /app

# ── Restaurar paquetes R con renv (capa cacheada) ─────────────────────────────
# Copiar solo los archivos de renv primero para aprovechar el cache de Docker.
# Si renv.lock no cambia, Docker reutiliza esta capa aunque cambie el código.
COPY renv.lock   renv.lock
COPY .Rprofile   .Rprofile
COPY renv/activate.R renv/activate.R

RUN R -e " \
  install.packages('renv', repos='https://cloud.r-project.org', quiet=TRUE); \
  renv::restore(prompt=FALSE) \
"

# ── Código de la aplicación ────────────────────────────────────────────────────
COPY app.R           app.R
COPY run.R           run.R
COPY global.R        global.R
COPY ui.R            ui.R
COPY ui_wrapper.R    ui_wrapper.R
COPY server.R        server.R
COPY server_auth.R   server_auth.R
COPY auth_config.R   auth_config.R
COPY auth_ui.R       auth_ui.R
COPY generar_tokens.R generar_tokens.R
COPY preparar_datos.R preparar_datos.R
COPY scripts/        scripts/
COPY www/            www/

# ── Directorios de datos y logs (se montan como volúmenes en runtime) ─────────
RUN mkdir -p datos fuente_de_datos logs

# ── Puerto expuesto (coincide con app.R línea 64) ─────────────────────────────
EXPOSE 80

# ── Healthcheck ───────────────────────────────────────────────────────────────
# Espera 90s al inicio porque global.R carga los RDS en memoria al arrancar
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -sf http://localhost:80/ || exit 1

# ── Arranque ──────────────────────────────────────────────────────────────────
CMD ["Rscript", "app.R"]
