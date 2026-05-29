# Proyecto 02 — Integra-ESAVI

## Propósito
Plataforma de integración que actúa como middleware y ETL entre las tres fuentes de datos de vigilancia de vacunas y efectos adversos de Ecuador. Consolida información proveniente de DHIS2, VigiFlow y la base de datos de vacunación en una única base de integración, expuesta a través de un back-end en NestJS y visualizada en un front-end en React.

Este directorio _workspace_ se creó de forma manual, puesto que contendrá la versión original sin fusionar con otras ramas desde el 23 de diciembre de 2025, del código fuente de la API y APP.

## Estructura
```
proyecto-02-integra-esavi/
├── src/             # Código fuente del back-end (NestJS) y front-end (React)
├── config/          # Archivos de configuración y variables de entorno por entorno
├── containers/      # Definiciones Docker para el despliegue de servicios
├── scripts/         # Scripts de automatización y utilidades del proyecto
├── test/            # Pruebas automatizadas (unitarias, integración y E2E)
├── docs/            # Documentación específica de Integra-ESAVI
│   ├── API/                    # Documentación de la API REST
│   ├── database/               # Esquema de la base de datos de integración
│   ├── capacitacion/
│   ├── manuales/
│   └── requerimientos/
└── .env.example     # Plantilla de variables de entorno requeridas
```

## Resumen del directorio
Integra-ESAVI es el núcleo de integración de la plataforma. El back-end en NestJS extrae datos de DHIS2 (programas ESAVI y EVADIE), VigiFlow y la base de datos de vacunación, aplica procesos de transformación para normalizar los esquemas de cada fuente, y los persiste en una base de integración unificada. El front-end en React expone esta información consolidada a los usuarios para análisis y gestión de casos.

## Ejemplos de qué puede escribirse aquí
- Módulos NestJS para conectores de DHIS2, VigiFlow y la base de vacunas
- Componentes React para visualización y gestión de casos ESAVI integrados
- Definición del esquema de la base de datos de integración y sus migraciones
- Docker Compose para levantar el entorno completo (back-end, front-end, base de datos)
- Casos de prueba para los procesos de transformación y normalización de datos
