# Scripts Transversales — DHIS2

## Propósito
Almacena scripts de uso general aplicables a todos los programas DHIS2 del proyecto (ESAVI, EVADIE y Vacunación). Centraliza operaciones que afectan a toda la instancia DHIS2 o que son reutilizadas por múltiples módulos.

## Estructura
```
scripts/
├── (scripts de administración general de la instancia DHIS2)
├── (scripts de migración y despliegue entre entornos)
├── (scripts de auditoría, monitoreo y respaldo)
└── (utilidades compartidas por los módulos ESAVI, EVADIE y Vacunación)
```

## Resumen del directorio
A diferencia de las carpetas `scripts/` dentro de cada módulo (esavi, evadie, vacunacion) que son específicas de cada programa, esta carpeta centraliza los scripts que operan a nivel de instancia DHIS2 o que son reutilizables entre todos los módulos. Es el punto de partida para tareas de DevOps relacionadas con DHIS2.

## Ejemplos de qué puede escribirse aquí
- Script para respaldo completo de todos los metadatos de la instancia DHIS2
- Script de creación de usuarios y asignación de roles y accesos en DHIS2
- Script de verificación del estado de la instancia DHIS2 (health check)
- Script de despliegue coordinado de metadatos en orden de dependencias (primero dataElements, luego programs, etc.)
- Funciones o utilidades Python/Shell reutilizadas por los scripts de ESAVI, EVADIE y Vacunación
