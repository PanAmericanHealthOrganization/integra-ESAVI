# Documentación General

## Propósito
Centraliza la documentación transversal de la plataforma: arquitectura del sistema, glosario de términos técnicos y clínicos, gobernanza del repositorio y plantillas reutilizables para los distintos proyectos.

## Estructura
```
docs/
├── arquitectura/
│   ├── diagramas/                  # Diagramas de arquitectura (C4, flujo de datos, etc.)
│   ├── documentos/                 # Documentos técnicos de arquitectura
│   ├── integraciones/              # Descripción de integraciones entre sistemas
│   └── resumen.md                  # Resumen ejecutivo de la arquitectura
├── glosario/
│   └── terminos.md                 # Definiciones de términos clave del dominio
├── gobernanza/
│   └── repositorio-estructura.md  # Reglas, convenciones y estructura del repositorio
└── plantillas/
    └── listado-plantillas.md       # Índice de plantillas disponibles para los proyectos
```

## Resumen del directorio
Esta carpeta actúa como la fuente de verdad documental de la plataforma. No contiene código ejecutable; todo su contenido son documentos de referencia que orientan a nuevos colaboradores y garantizan la coherencia entre los tres proyectos principales. Es el primer lugar donde buscar cuando se necesita entender cómo está diseñado el sistema.

## Ejemplos de qué puede escribirse aquí
- Diagrama de flujo de datos entre DHIS2, VigiFlow y la base de vacunas
- Definición de términos como ESAVI, EVADIE, VigiFlow, TrackedEntity, programa Tracker
- Convenciones de nomenclatura para archivos, variables y metadatos DHIS2
- Plantilla estándar para documentar requerimientos funcionales de cada proyecto
- Descripción de los actores del sistema (MSP Ecuador, OPS/PAHO, equipos técnicos)
