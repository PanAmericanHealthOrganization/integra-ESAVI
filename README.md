# Plataforma de Gestión de ESAVI para Ecuador

## Propósito
Repositorio central que agrupa los componentes técnicos para la vigilancia de Eventos Supuestamente Atribuibles a la Vacunación e Inmunización (ESAVI) y eventos relacionados en Ecuador. Centraliza la configuración de DHIS2, la capa de integración de datos y los tableros analíticos en un único repositorio estructurado.

## Estructura
```
esavi-platform/
├── proyecto-01-dhis2/         # Configuración de programas DHIS2 (ESAVI, EVADIE, Vacunación)
├── proyecto-02-integra-esavi/ # Middleware ETL entre DHIS2, VigiFlow y base de vacunas
├── proyecto-03-analitica/     # Tableros, reportes y scripts de análisis
├── docs/                      # Documentación general y transversal de la plataforma
└── shared/                    # Recursos, estándares y referencias compartidas
```

## Resumen del directorio
Este repositorio es el punto de entrada de la plataforma ESAVI de Ecuador. Cada subcarpeta principal corresponde a un proyecto independiente con su propio ciclo de vida, pero todos comparten el objetivo de gestionar, integrar y visualizar datos de vigilancia de vacunas y efectos adversos. La plataforma sigue los estándares técnicos de la OPS/PAHO para la notificación de ESAVI.

## Ejemplos de qué puede escribirse aquí
- Descripción general de la plataforma y sus objetivos estratégicos
- Instrucciones de configuración inicial del entorno de desarrollo
- Guía de contribución y convenciones del repositorio
- Diagrama de arquitectura de alto nivel con los tres proyectos y sus interacciones
- Tabla de versiones activas de cada proyecto y sus dependencias
