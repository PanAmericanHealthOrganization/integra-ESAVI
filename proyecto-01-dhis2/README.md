# Proyecto 01 — DHIS2

## Propósito
Contiene todos los artefactos de configuración y metadatos para los programas DHIS2 implementados en Ecuador: el programa de notificación de ESAVI, el seguimiento de EVADIE y el registro de vacunación. Incluye formularios, metadatos exportables e importables vía API, y scripts de administración.

## Estructura
```
proyecto-01-dhis2/
├── esavi/          # Programa Tracker DHIS2 para notificación de ESAVI
├── evadie/         # Programa Tracker DHIS2 para EVADIE
├── vacunacion/     # Programa DHIS2 para registro de vacunación
├── scripts/        # Scripts transversales de administración de la instancia DHIS2
└── docs/           # Documentación específica del proyecto DHIS2
    ├── capacitacion/
    ├── gestion-cambio/
    ├── manuales/
    │   ├── configuracion/
    │   ├── desarrollador/
    │   ├── tecnicos/
    │   └── usuario/
    └── requerimientos/
        ├── funcionales/
        └── nofuncionales/
```

## Resumen del directorio
Este proyecto gestiona la capa de captura de datos en DHIS2. Cada módulo (esavi, evadie, vacunacion) tiene su propia estructura de metadatos que puede exportarse e importarse vía la API de DHIS2, lo que permite versionar y replicar la configuración entre entornos (desarrollo, staging, producción). Los scripts de la raíz automatizan tareas que afectan a toda la instancia.

## Ejemplos de qué puede escribirse aquí
- Archivos JSON de metadatos de programas Tracker exportados desde DHIS2
- Reglas de programa (programRules) para validación de formularios de notificación
- Scripts de importación y exportación de metadatos vía la API de DHIS2
- Documentación de requerimientos funcionales para cada módulo del sistema
- Manual de usuario para el registro de casos ESAVI en la interfaz DHIS2
