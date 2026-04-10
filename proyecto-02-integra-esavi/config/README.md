# Configuraciones y Entornos — Integra-ESAVI

## Propósito
Centraliza los archivos de configuración del proyecto Integra-ESAVI: parámetros de conexión a las fuentes de datos (DHIS2, VigiFlow, base de vacunas), configuración de la base de integración y ajustes específicos por entorno (desarrollo, staging, producción).

## Estructura
```
config/
├── (configuración de conexión a DHIS2)
├── (configuración de conexión a VigiFlow)
├── (configuración de la base de datos de vacunación)
├── (configuración de la base de datos de integración)
└── (parámetros de la aplicación por entorno: dev, staging, production)
```

## Resumen del directorio
Esta carpeta separa la configuración del código fuente, siguiendo el principio de configuración como entorno. Los valores sensibles como credenciales, tokens de API y cadenas de conexión no se almacenan directamente en el repositorio, sino que se gestionan mediante variables de entorno definidas en un archivo `.env` local (usando `.env.example` como plantilla de referencia).

## Ejemplos de qué puede escribirse aquí
- Archivo `database.config.ts` con los parámetros de conexión a la base de integración
- Archivo `dhis2.config.ts` con la URL base y las credenciales de la API de DHIS2
- Archivo `vigiflow.config.ts` con los parámetros de la API de VigiFlow
- Configuración de CORS, rate limiting y autenticación JWT para el back-end NestJS
- Perfiles de configuración diferenciados para desarrollo, staging y producción
