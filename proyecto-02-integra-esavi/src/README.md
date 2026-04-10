# Código Fuente — Integra-ESAVI

## Propósito
Contiene el código fuente del proyecto Integra-ESAVI: los módulos del back-end en NestJS (conectores ETL, API REST, lógica de transformación de datos) y los componentes del front-end en React (interfaz de usuario para visualización y gestión de casos ESAVI integrados).

## Estructura
```
src/
├── (módulos NestJS del back-end)
│   ├── connectors/   # Conectores para DHIS2, VigiFlow y base de vacunas
│   ├── etl/          # Servicios de extracción, transformación y carga de datos
│   ├── api/          # Controladores, rutas y DTOs de la API REST
│   └── database/     # Modelos, repositorios y migraciones de la base de integración
└── (componentes React del front-end)
    ├── components/   # Componentes reutilizables de la interfaz
    ├── pages/        # Páginas principales de la aplicación
    └── services/     # Servicios de comunicación con la API del back-end
```

## Resumen del directorio
Es el núcleo de desarrollo del proyecto. El back-end en NestJS orquesta la extracción de datos desde las tres fuentes (DHIS2, VigiFlow, base de vacunas), aplica las transformaciones necesarias para unificar los esquemas y persiste los resultados en la base de integración. El front-end React consume la API REST del back-end para mostrar la información consolidada de ESAVI a los usuarios finales.

## Ejemplos de qué puede escribirse aquí
- Módulo NestJS `DhisConnectorModule` para extracción de eventos Tracker ESAVI
- Módulo NestJS `VigiflowConnectorModule` para lectura de reportes desde la API de VigiFlow
- Servicio ETL que normaliza y mapea los campos de las tres fuentes al esquema unificado
- Componente React `EsaviCaseList` para visualización y filtrado de casos integrados
- Controlador REST `EsaviController` con endpoints de consulta, filtrado y exportación de datos
