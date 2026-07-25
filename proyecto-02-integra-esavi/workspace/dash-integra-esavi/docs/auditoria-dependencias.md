# Auditoría de dependencias del dashboard

Fecha: 2026-07-24. Método: cierre transitivo (`Depends`/`Imports`/`LinkingTo`) de
los `DESCRIPTION` en `renv/library/`, partiendo de los paquetes referenciados en
el código (`library()`, `require()`, `pkg::`), cruzado con `renv.lock` (147 paquetes)
y con los `SystemRequirements` declarados por cada paquete.

## Resumen

- **138 de 147** paquetes del lock son alcanzables desde el código.
- Los 9 restantes (`BiocManager`, `BiocVersion`, `MASS`, `MatrixModels`, `SparseM`,
  `coda`, `mcmc`, `quantreg`, `survival`) son dependencias de `MCMCpack` (que a su
  vez viene de `PhViD`) o del propio `BiocManager`; salvo `BiocManager`/`BiocVersion`
  no son eliminables por separado.
- Casi nada es "grasa": el lock es mayoritariamente cierre transitivo correcto.
  Lo único recortable es a nivel de **paquete raíz** (los que el código carga).

## Paquetes raíz que el código carga pero NO usa

| Paquete | Evidencia | Al quitarlo se van |
|---|---|---|
| `flextable` | solo `library(flextable)` en `global.R:61`; ninguna función del paquete se usa (`officer::fp_border` sí se usa, pero `officer` es raíz aparte) | `flextable`, `gdtools`, `fontquiver`, `fontLiberation`, `fontBitstreamVera` (**−5**, y con `gdtools` desaparece el requisito de **cairo**) |
| `RPostgres` | solo en `preparar_datos.R`, script que **nadie hace `source()`**; el pipeline R fue reemplazado por el datamart DuckDB del API | `RPostgres`, `bit`, `bit64`, `blob`, `hms`, `plogr` (**−6**, y con ello **libpq-dev**) |
| `wordcloud` | `library(wordcloud)`; las nubes de palabras se dibujan con `hchart(paso, "wordcloud")` = highcharter | `wordcloud` (**−1**) |
| `BiocManager` | solo aparece en líneas **comentadas** (`global.R:83-85`) | `BiocManager`, `BiocVersion` (**−2**) |
| `TTR` | `library(TTR)` en `global.R` y `ui.R`; ninguna función suya se usa | **−0**: entra igual vía `highcharter → quantmod → TTR` |
| `rstudioapi` | solo se usa dentro de `if (interactive())` | **−0**: es dependencia de otros |

Quitar los cuatro primeros: **−14 paquetes** y se pueden retirar `libpq-dev` y
`libcairo2-dev`. Requiere borrar los `library()` correspondientes **y** regenerar
el lock con `renv::snapshot()`.

## Paquetes caros que SÍ son necesarios

| Cadena | Origen | Por qué no se puede quitar |
|---|---|---|
| `sf`, `raster`, `terra`, `sp`, `s2`, `units`, `classInt`, `proxy`, `e1071`, `wk` | `leaflet` + uso directo de `sf` | el mapa es real: `leafletOutput("mapa")` en `ui.R:791`, `renderLeaflet` en `server.R:6140` |
| `igraph`, `quantmod`, `xts`, `TTR`, `zoo`, `rlist`, `XML`, `broom`, `Matrix` | `highcharter` | highcharter se usa en todos los gráficos |
| `MCMCpack`, `LBE`, `coda`, `mcmc`, `quantreg`, … | `PhViD` | `as.PhViD()` en `server.R:567` (análisis de desproporcionalidad) |
| `officer`, `ragg`, `systemfonts`, `textshaping` | `officer` (usado directo) | `officer::fp_border` en `global.R:254` |

## Librerías de sistema del `Dockerfile.deps`

Justificación por `SystemRequirements` declarado:

| Paquete apt | Lo exige | Veredicto |
|---|---|---|
| `libgdal-dev`, `libgeos-dev`, `libproj-dev` | `sf`, `terra` | necesario |
| `libudunits2-dev` | `units` (←`sf`) | necesario |
| `libssl-dev` | `openssl`, `s2` | necesario |
| `libcurl4-openssl-dev` | `curl` | necesario |
| `libxml2-dev` | `xml2`, `XML`, `igraph` | necesario |
| `libpq-dev` | `RPostgres` **únicamente** | eliminable si se quita `RPostgres` |
| `libcairo2-dev` | `gdtools` (←`flextable`) **únicamente** | eliminable si se quita `flextable` |
| `libfreetype6-dev`, `libfontconfig1-dev` | `systemfonts`, `ragg`, `gdtools` | necesario |
| `libharfbuzz-dev`, `libfribidi-dev` | `textshaping` | necesario |
| `libabsl-dev` | `s2` (`Abseil >= 20230802.0`) | necesario |
| `libglpk-dev` | `igraph` (opcional pero recomendado) | mantener |
| `cmake` | `s2` | necesario |
| `libxt-dev` | **ningún paquete lo declara** | candidato a quitar |

Faltantes potenciales, solo relevantes al compilar desde fuente (arm64):
`ragg` declara `libpng/libtiff/libjpeg/libwebp` y `duckdb` declara `xz`; hoy los
cubre la imagen `rocker/r-ver` de base. Si un build arm64 falla en esos paquetes,
añadir `libpng-dev libtiff-dev libjpeg-dev libwebp-dev liblzma-dev`.

## Nota sobre el tiempo de build

El coste real no viene del número de paquetes sino de la arquitectura: los binarios
de Posit PPM (`__linux__/jammy`) son **solo x86_64**. En un motor arm64 los 147
paquetes se compilan desde fuente. Ver `DESPLIEGUE-PRODUCCION.md`.
