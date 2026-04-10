# Proyecto 03 — Analítica

## Propósito
Centraliza los componentes de análisis, visualización y reportes de la plataforma ESAVI de Ecuador. Incluye scripts ETL para preparación de datos analíticos, tableros interactivos (R Shiny, DHIS2 Analytics), reportes automatizados, y las definiciones de esquemas y diccionarios de datos analíticos.

## Estructura
```
proyecto-03-analitica/
├── data/
│   ├── diccionarios/    # Diccionarios de datos y codebooks de las variables analíticas
│   ├── sample/          # Datos de muestra anonimizados para desarrollo y pruebas
│   └── schemas/         # Definición de esquemas de datos para análisis
├── etl/                 # Scripts de transformación de datos para el pipeline analítico
├── outputs/
│   ├── exports/         # Archivos de datos exportados (CSV, Excel, JSON)
│   └── reports/         # Reportes generados (PDF, HTML)
├── scripts/
│   ├── R/               # Scripts de análisis estadístico y procesamiento en R
│   ├── js/              # Scripts JavaScript para visualizaciones interactivas web
│   └── python/          # Scripts de procesamiento, análisis y generación de reportes en Python
├── tableros/
│   ├── analytics/       # Configuración de tableros en DHIS2 Analytics
│   ├── packages/        # Paquetes de configuración y dependencias de tableros
│   ├── scripts/         # Scripts de despliegue y actualización de tableros
│   ├── shiny/           # Aplicaciones interactivas desarrolladas en R Shiny
│   └── visualizations/  # Definiciones y configuraciones de visualizaciones
└── docs/                # Documentación del proyecto analítico
```

## Resumen del directorio
Este proyecto toma los datos consolidados de la base de integración generada por Integra-ESAVI y los transforma en insumos analíticos para la toma de decisiones en vigilancia epidemiológica. Combina R para análisis estadístico y aplicaciones Shiny interactivas, Python para procesamiento automatizado de datos, y DHIS2 Analytics para tableros operacionales. Es la capa de inteligencia de la plataforma ESAVI.

## Ejemplos de qué puede escribirse aquí
- Script R para análisis de tendencias de ESAVI por región, tipo de vacuna y periodo
- Aplicación R Shiny con mapa interactivo de distribución geográfica de casos ESAVI en Ecuador
- Script Python para generación automática de reportes semanales en formato PDF
- Configuración de tablero DHIS2 Analytics con indicadores de tasa de notificación ESAVI
- Diccionario de datos con la definición, tipo y fuente de cada variable analítica del sistema
