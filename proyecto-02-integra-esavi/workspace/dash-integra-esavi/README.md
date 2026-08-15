# Dashboard ESAVI

Dashboard interactivo para el análisis de Eventos Supuestamente Atribuibles a Vacunación o Inmunización (ESAVI).

## Requisitos Previos

- R versión 4.0 o superior
- RStudio (recomendado para desarrollo)
- Conexión a internet para instalar paquetes

## Estructura del Proyecto

```
Dashboard/
├── datos/                    # Archivos de datos
│   ├── datos_procesados.rds  # Datos principales de ESAVI
│   ├── dosis_admin.rds       # Datos de dosis administradas
│   ├── geo_datos.rds         # Datos geográficos
│   └── timeline.csv          # Datos de línea temporal
├── scripts/                  # Scripts de procesamiento
│   └── procesamiento_datos.R
├── www/                      # Recursos web (CSS, JS, imágenes)
│   ├── css/
│   ├── js/
│   └── images/
├── global.R                  # Variables globales y configuración
├── ui.R                      # Interfaz de usuario
├── server.R                  # Lógica del servidor
├── ejecutar_dashboard.R      # Script completo de ejecución
├── run.R                     # Script simple de ejecución
└── README.md                 # Este archivo
```

## Origen de los datos: el datamart DuckDB

El dashboard **no** consulta la base de datos: lee `datos/esavi.duckdb`, un archivo que
produce el módulo `datamart` de `api-integra-esavi` con las tablas `datos_procesados` y
`dosis_admin` ya procesadas. Reemplaza al antiguo pipeline en R (`preparar_datos.R` +
`scripts/procesamiento_datos.R`).

El archivo vive aquí, en `datos/`, aunque quien lo produce sea el API: se guarda del lado
del consumidor para que el dashboard lo encuentre en su ruta por defecto sin enlaces ni
copias, dentro y fuera del contenedor. Corriendo el API en local, eso lo determina
`DATAMART_DUCKDB_PATH` en el `.env` del API, que apunta a esta carpeta; en contenedor, el
mismo directorio se monta en el API como `/app/datamart-out` y en el dashboard como
`/app/datos`.

Si el datamart todavía no existe, se genera con el API arriba mediante
`POST /v1/datamart/regenerar` (rol `admin`), con el cron diario, o automáticamente al
arrancar el API cuando el archivo falta.

Como `datos/` está en `.gitignore`, en un clon nuevo el archivo no está. El síntoma de
arrancar sin él es engañoso: el dashboard toma el `esavi.duckdb` de ejemplo, con cero
filas, y las secciones aparecen vacías sin ningún error visible. Por eso ambos compose
traen un servicio `duckdb-check` que corre antes del dashboard y aborta el despliegue con
un mensaje claro. En el stack completo ese chequeo además **espera** hasta 10 minutos,
porque el API genera el datamart en segundo plano y estar `healthy` no implica que el
archivo ya esté escrito.

Una vez en su sitio, el dashboard detecta las regeneraciones solo: sondea la fecha de
modificación del archivo cada `DUCKDB_POLL_INTERVAL_MS` (60 s por defecto) y recarga los
datos sin reiniciar.

## Formas de Ejecutar el Dashboard

### Opción 1: Script Completo (Recomendado)

Este script verifica dependencias, instala paquetes faltantes y ejecuta la aplicación:

```r
# Desde RStudio
source("ejecutar_dashboard.R")
```

### Opción 2: Script Simple

Para ejecución rápida desde terminal:

```bash
# Desde terminal/consola
Rscript run.R
```

### Opción 3: Ejecución Manual desde RStudio

```r
# 1. Abrir el proyecto en RStudio
# 2. Ejecutar en la consola:
shiny::runApp()

# O alternativamente:
library(shiny)
runApp(host = "0.0.0.0", port = 3838, launch.browser = TRUE)
```

## Instalación de Dependencias

El script `ejecutar_dashboard.R` instala automáticamente todas las dependencias necesarias. Las principales librerías incluyen:

- **Shiny ecosystem**: `shiny`, `shinydashboard`, `shinydashboardPlus`, `shinyWidgets`, `shinyjs`
- **Visualización**: `ggplot2`, `highcharter`, `leaflet`, `DT`, `wordcloud`
- **Manipulación de datos**: `dplyr`, `data.table`, `lubridate`, `stringr`
- **Análisis espacial**: `sf`, `leaflet.extras`
- **Análisis estadístico**: `PhViD` (para análisis de desproporcionalidad)

## Configuración

### Puerto y Host

Por defecto, la aplicación se ejecuta en:
- Host: `localhost` (127.0.0.1)
- Puerto: `3838`
- URL: `http://localhost:3838`

Para cambiar estos valores, edita las opciones en los scripts de ejecución.

### Datos

Asegúrate de que todos los archivos en la carpeta `datos/` estén disponibles:
- `datos_procesados.rds`: Datos principales de ESAVI
- `dosis_admin.rds`: Información de dosis administradas
- `geo_datos.rds`: Datos geográficos para mapas
- `timeline.csv`: Eventos de línea temporal

## Solución de Problemas

### Error: Paquetes faltantes
```r
# Ejecutar el script completo que instala dependencias:
source("ejecutar_dashboard.R")
```

### Error: Archivos de datos no encontrados
- Verificar que la carpeta `datos/` contenga todos los archivos `.rds` y `.csv`
- Revisar las rutas en `global.R` si los datos están en otra ubicación

### Error: Puerto ocupado
```r
# Cambiar el puerto en el script de ejecución:
options(shiny.port = 3839)  # o cualquier otro puerto disponible
```

### Problemas de encoding
El dashboard está configurado para español UTF-8. Si hay problemas de caracteres especiales, verificar la configuración regional del sistema.

## Desarrollo y Personalización

- **global.R**: Configuración global, carga de datos, funciones auxiliares
- **ui.R**: Interfaz de usuario, layout y componentes visuales
- **server.R**: Lógica del servidor, procesamiento de datos y reactividad
- **www/css/style.css**: Estilos personalizados
- **www/js/**: Scripts JavaScript para funcionalidades adicionales

## Contacto

- **Epidemióloga**: Analía Cáceres (caceresanali@paho.org)
- **Científico de Datos**: Carlos Falla (fallacar@paho.org)

---

Para más información sobre Shiny, consulta la [documentación oficial](https://shiny.rstudio.com/).


