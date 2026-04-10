# Scripts — ESAVI DHIS2

## Propósito
Almacena scripts de automatización para tareas de administración, migración y mantenimiento del programa ESAVI en la instancia DHIS2 de Ecuador.

## Estructura
```
scripts/
├── (scripts de importación y exportación de metadatos ESAVI vía API DHIS2)
├── (scripts de migración de configuración entre entornos)
└── (scripts de validación y auditoría de datos del programa)
```

## Resumen del directorio
Los scripts de esta carpeta interactúan con la API de DHIS2 para automatizar operaciones que serían manuales en la interfaz web. Son específicos del programa ESAVI y complementan el trabajo de configuración almacenado en la carpeta `metadata/`. Para scripts que afectan a toda la instancia DHIS2, ver `proyecto-01-dhis2/scripts/`.

## Ejemplos de qué puede escribirse aquí
- Script Python o Shell para importar los metadatos ESAVI vía API DHIS2
- Script para comparar la configuración del programa entre dos entornos (dev vs. producción)
- Script de exportación de eventos ESAVI en formato CSV o JSON para análisis externo
- Script de limpieza de registros duplicados o incompletos en el programa Tracker
- Script de validación que verifica la integridad referencial de los metadatos importados
