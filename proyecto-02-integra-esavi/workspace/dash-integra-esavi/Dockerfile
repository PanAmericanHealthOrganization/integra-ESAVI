FROM rocker/r-ver:4.4.1

# ── Sistema operativo ─────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    libcairo2-dev \
    libxt-dev \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    libudunits2-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    libxml2-dev \
    libfontconfig1-dev \
    libfreetype6-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libabsl-dev \
    cmake \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Binarios PPM para Ubuntu 22.04 Jammy — descarga binarios precompilados, no compila.
ENV RENV_CONFIG_PPM_ENABLED=true
ENV RENV_CONFIG_PPM_URL=https://packagemanager.posit.co/cran/__linux__/jammy/latest

# ── Paquetes R (capa cacheada — solo se repite si cambia renv.lock) ───────────
COPY renv.lock   renv.lock
COPY .Rprofile   .Rprofile

RUN sed -i 's|https://cloud.r-project.org|https://packagemanager.posit.co/cran/__linux__/jammy/latest|g' renv.lock && \
    R --no-init-file -e " \
      install.packages('renv', repos = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest', quiet = TRUE); \
      renv::restore(prompt = FALSE) \
    "

# ── Código de la aplicación ────────────────────────────────────────────────────
COPY run.R            run.R
COPY global.R         global.R
COPY ui.R             ui.R
COPY server.R         server.R
COPY preparar_datos.R preparar_datos.R
COPY scripts/         scripts/
COPY www/             www/

RUN mkdir -p datos fuente_de_datos logs

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -sf http://localhost:80/ || exit 1

CMD ["Rscript", "run.R"]
