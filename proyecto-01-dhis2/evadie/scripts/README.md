# Scripts — EVADIE DHIS2

## Propósito
Almacena scripts de automatización para tareas de administración, migración y mantenimiento del programa EVADIE en la instancia DHIS2 de Ecuador.

## Estructura
```
scripts/
├── (scripts de importación y exportación de metadatos EVADIE vía API DHIS2)
├── (scripts de migración de configuración entre entornos)
└── (scripts de validación y auditoría de datos del programa)
```

## Resumen del directorio
Los scripts de esta carpeta son específicos del programa EVADIE e interactúan con la API de DHIS2 para automatizar operaciones de mantenimiento. Complementan los metadatos almacenados en `metadata/`. Para scripts transversales que afectan a toda la instancia DHIS2, ver `proyecto-01-dhis2/scripts/`.

## Ejemplos de qué puede escribirse aquí
- Script Python o Shell para importar los metadatos EVADIE vía API DHIS2
- Script para exportar eventos EVADIE en formato CSV o JSON para análisis
- Script de comparación de metadatos entre entornos (desarrollo vs. producción)
- Script de validación de registros EVADIE antes de la sincronización con Integra-ESAVI
- Script de migración para actualizar la versión del programa EVADIE en producción
