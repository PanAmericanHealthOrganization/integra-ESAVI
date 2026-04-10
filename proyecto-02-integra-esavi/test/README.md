# Pruebas Automatizadas — Integra-ESAVI

## Propósito
Centraliza las pruebas automatizadas del proyecto Integra-ESAVI: pruebas unitarias de servicios y transformaciones, pruebas de integración de los conectores con las fuentes de datos, y pruebas end-to-end de los flujos ETL completos.

## Estructura
```
test/
├── (pruebas unitarias de módulos y servicios NestJS)
├── (pruebas de integración de conectores DHIS2, VigiFlow y base de vacunas)
├── (pruebas end-to-end de los flujos ETL completos)
└── (fixtures y datos de muestra para pruebas reproducibles)
```

## Resumen del directorio
La cobertura de pruebas es crítica en este proyecto dado que los procesos ETL transforman datos clínicos sensibles. Las pruebas garantizan que las transformaciones entre el esquema de DHIS2, VigiFlow y la base de vacunas sean correctas y trazables antes de llegar a la base de integración. Los fixtures de datos de muestra permiten ejecutar pruebas sin depender de sistemas externos.

## Ejemplos de qué puede escribirse aquí
- Test unitario para el servicio que mapea campos de DHIS2 al esquema de integración
- Test de integración que verifica la conexión y extracción de datos desde VigiFlow
- Test E2E del flujo completo: extracción desde DHIS2 → transformación → carga → consulta por API
- Fixtures con datos de muestra de casos ESAVI para pruebas reproducibles y aisladas
- Test de regresión para casos borde en la normalización de fechas, códigos y valores nulos
