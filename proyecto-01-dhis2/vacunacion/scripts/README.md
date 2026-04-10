# Scripts — Vacunación DHIS2

## Propósito
Almacena scripts de automatización para tareas de administración, migración y mantenimiento del programa de vacunación en la instancia DHIS2 de Ecuador.

## Estructura
```
scripts/
├── (scripts de importación y exportación de metadatos de vacunación vía API DHIS2)
├── (scripts de migración de configuración entre entornos)
└── (scripts de validación y exportación de registros de vacunación)
```

## Resumen del directorio
Los scripts de esta carpeta son específicos del programa de vacunación e interactúan con la API de DHIS2. Complementan los metadatos almacenados en `metadata/` y facilitan la extracción de datos de vacunas que serán consumidos por Integra-ESAVI para la trazabilidad con ESAVI y EVADIE. Para scripts transversales, ver `proyecto-01-dhis2/scripts/`.

## Ejemplos de qué puede escribirse aquí
- Script para importar o actualizar metadatos del programa de vacunación vía API DHIS2
- Script de exportación de registros de vacunación por periodo y unidad organizativa
- Script para cruzar registros de vacunación con notificaciones ESAVI por número de lote
- Script de validación de cobertura vacunal por establecimiento de salud
- Script de migración para actualizar la versión del programa de vacunación en producción
