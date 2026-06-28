# Observaciones Técnicas — Proyecto Integra-ESAVI

**Fecha:** 2026-06-26
**Versión analizada:** branch `dev` (commit `b27e0f6`)
**Alcance:** Workspace completo (api-integra-esavi, app-integra-esavi, dash-integra-esavi)

---

## Resumen Ejecutivo

El proyecto presenta una arquitectura técnicamente sólida para la integración de notificaciones ESAVI entre fuentes heterogéneas (DHIS2, VigiFlow, Oracle Vacunación). Sin embargo, contiene vulnerabilidades de seguridad críticas, bugs funcionales documentados y una deuda técnica acumulada que representan riesgos para su operación en producción.

| Dimensión        | Calificación |
|------------------|:------------:|
| Arquitectura     | 7 / 10       |
| Calidad de código| 4 / 10       |
| Testing          | 1 / 10       |
| Seguridad        | 3 / 10       |
| Documentación    | 5 / 10       |
| Infraestructura  | 6 / 10       |
| CI/CD            | 1 / 10       |
| **Promedio**     | **3.9 / 10** |

---

## 1. Arquitectura

### 1.1 Estructura del Workspace

```
workspace/
├── api-integra-esavi/      Backend NestJS 11 (TypeScript)
├── app-integra-esavi/      Frontend React 18 + Vite (TypeScript)
├── dash-integra-esavi/     Dashboard Shiny (R)
└── docker-compose.dev.yaml Orquestación local
```

### 1.2 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + Vite | 18.2.0 / 5.4.0 |
| UI Framework | Material-UI + React Admin | 5.14.10 / 5.3.0 |
| Autenticación | Keycloak JS | 26.0.0 |
| Backend | NestJS | 11.1.8 |
| ORM | TypeORM | 0.3.27 |
| BD Principal | PostgreSQL | 15 |
| BD Vacunación | Oracle | oracledb 6.10.0 |
| Dashboard | R Shiny | 4.0+ |
| Contenedores | Docker + Compose | — |
| Auth Server | Keycloak | 26.6.3 |

### 1.3 Diagrama de Flujo de Datos

```
DHIS2 ──────┐
VigiFlow ───┼──► API NestJS ──► PostgreSQL ──► App React
Oracle ─────┘    (integrador)   (DHI_ESAVI)    (Frontend)
                      │                         │
                      └──► Reportes PDF    Dashboard Shiny
                           (Puppeteer)      (Análisis R)
```

### 1.4 Fortalezas Arquitectónicas

- Modularidad NestJS bien aplicada: 16 módulos con responsabilidades claras (dhis2, vigiflow, vacunacion, meddra, whodrugs, homologator, dataquality, etc.)
- 28 data providers en el frontend bien segregados por dominio
- Patrón Adapter para normalizar datos de múltiples fuentes a entidades comunes
- Keycloak centralizado para autenticación y autorización con roles definidos

### 1.5 Observaciones

- El frontend no usa un gestor de estado global (Redux/Zustand), solo `Context API`. Para la escala actual esto es aceptable, pero puede generar inconsistencias si crece la complejidad de estado compartido entre vistas.
- La versión de TypeScript difiere entre frontend (4.9.4) y backend (5.9.3). Deberían alinearse para coherencia en herramientas y configuraciones compartidas.

---

## 2. Seguridad

### OBS-SEC-01: Command Injection — `reporte.service.ts`

**Severidad:** CRITICA

El servicio de reportes utiliza `child_process.exec()` interpolando directamente `process.env.DIR_PDF` sin sanitizar:

```typescript
// VULNERABLE
child_process.exec(`mkdir -p ${process.env.DIR_PDF}`)
```

Si `DIR_PDF` contiene metacaracteres de shell (`;`, `|`, `&&`), un atacante con acceso al entorno puede ejecutar comandos arbitrarios en el servidor.

**Corrección recomendada:**

```typescript
// SEGURO
import { mkdir } from 'fs/promises'
await mkdir(process.env.DIR_PDF, { recursive: true })
```

---

### OBS-SEC-02: SQL Injection en Query Builder Dinámico — `notificacion.service.ts:128-133`

**Severidad:** ALTA

El filtro genérico construye nombres de columna a partir de la entrada del cliente sin validación:

```typescript
// VULNERABLE
queryBuilder.andWhere(`notificacion.${key} = :value`, { value: filters[key] })
```

**Corrección recomendada:**

```typescript
const COLUMNAS_PERMITIDAS = new Set(['estado', 'provincia_id', 'anio'])

if (!COLUMNAS_PERMITIDAS.has(key)) {
  throw new BadRequestException(`Filtro no permitido: ${key}`)
}
queryBuilder.andWhere(`notificacion.${key} = :value`, { value: filters[key] })
```

---

### OBS-SEC-03: Credenciales Sensibles en Repositorio

**Severidad:** ALTA

El archivo `.env` del backend contiene credenciales de producción versionadas en el repositorio:

- Credenciales de BD Oracle (`DB_VACUNACION_DB_PASS`)
- Claves de APIs externas (MedDRA, WhoDrug)
- Credenciales de VigiFlow y DHIS2

**Acciones requeridas:**

1. Eliminar `.env` del historial del repositorio (BFG Repo Cleaner o `git filter-repo`)
2. Agregar `.env` al `.gitignore`
3. Mantener únicamente `.env.example` con valores de placeholder
4. Rotar todas las credenciales expuestas inmediatamente
5. Usar variables de entorno del CI/CD o un gestor de secretos en producción

---

### OBS-SEC-04: Decodificación JWT sin Validación de Firma — `jwt.util.ts`

**Severidad:** MEDIA

El módulo decodifica el JWT para extraer información de contexto sin verificar la firma criptográfica. Si esta función se usa para tomar decisiones de autorización, representa un riesgo grave.

**Recomendación:** Documentar explícitamente que es solo para contexto informativo. La validación de autorización debe delegarse completamente al guard de Passport/Keycloak.

---

### OBS-SEC-05: Exposición de Información en Errores HTTP 500

**Severidad:** BAJA-MEDIA

El `HttpExceptionFilter` incluye `request.body.ent_id` y `usr_usuario` en las respuestas de error. Esto expone información interna del sistema a clientes externos.

**Recomendación:** Limitar la respuesta al cliente a un código de error y mensaje genérico. Registrar el detalle completo solo en el logger del servidor.

---

## 3. Bugs Funcionales

### OBS-BUG-01: `exist()` sin `await` — `sync.service.ts`

**Severidad:** ALTA

El método retorna una `Promise<boolean>` sin resolverla. Al no usar `await`, la expresión siempre es truthy:

```typescript
// BUG — siempre retorna true (Promise es truthy)
exist(): boolean {
  return this.notificacionService.findOne(...)
}
```

**Impacto:** Las sincronizaciones pueden ejecutarse duplicadas o saltar validaciones de existencia sin registrar el error.

**Corrección:**

```typescript
async exist(): Promise<boolean> {
  const result = await this.notificacionService.findOne(...)
  return result !== null && result !== undefined
}
```

---

### OBS-BUG-02: Métodos Invertidos — `notificacion.service.ts`

**Severidad:** ALTA

Los métodos `findAntecedenteEmbarazoByNotificacionUUID` y `findAntecedenteMedicoByNotificacionUUID` tienen sus implementaciones intercambiadas: cada uno llama internamente al servicio del otro.

**Impacto:** Reportes de casos ESAVI muestran datos de embarazo donde corresponde historia médica y viceversa, generando información clínica incorrecta.

**Corrección:** Revisar e intercambiar las implementaciones de los dos métodos y agregar tests unitarios que validen el retorno correcto de cada uno.

---

## 4. Calidad del Código

### OBS-COD-01: Logging Inconsistente — 175+ ocurrencias

`console.log / console.error / console.warn` dispersos en el backend en lugar de usar el `Logger` inyectable de NestJS.

**Impacto:** Imposibilidad de controlar el nivel de log por módulo, pérdida de contexto en trazas, incompatibilidad con sistemas de logging centralizados.

**Recomendación:**

```typescript
import { Logger } from '@nestjs/common'
private readonly logger = new Logger(MiServicio.name)

this.logger.error('Mensaje de error', error.stack)
```

---

### OBS-COD-02: Duplicación de Lógica

| Lógica duplicada | Archivos afectados |
|---|---|
| `calcularEdad()` | `notificacion-dhis2.service.ts`, `notificacion-vigiflow.service.ts` |
| `findParroquiaByCodigo()` | Al menos 2 servicios de integración |
| `UUID_REGEX` | Definido en 3 archivos distintos |

**Recomendación:** Centralizar en `src/common/utils/` con funciones exportadas y reutilizadas.

---

### OBS-COD-03: Configuración de Entorno Hardcodeada en 17 Servicios

`process.env.USUARIO_INSERTA_REGISTRO` se lee directamente sin usar `ConfigService` y sin valor de fallback.

**Impacto:** Si la variable no está definida, el valor es `undefined` y puede producir errores silenciosos o datos corruptos en auditoría.

**Corrección:**

```typescript
constructor(private readonly config: ConfigService) {}

const usuario = this.config.get<string>('USUARIO_INSERTA_REGISTRO', 'SYSTEM')
```

---

### OBS-COD-04: Código Comentado — 170+ líneas

Código comentado (incluyendo el método `create()` antiguo) permanece en el repositorio aumentando la carga cognitiva.

**Recomendación:** Eliminar todo código comentado. El historial de git sirve como referencia de implementaciones anteriores.

---

### OBS-COD-05: HTTP Exception Filter no Global

El `HttpExceptionFilter` está aplicado solo a 2 controladores. El resto de endpoints devuelven errores sin formato consistente.

**Corrección en `main.ts`:**

```typescript
app.useGlobalFilters(new HttpExceptionFilter())
```

---

### OBS-COD-06: Módulo Importado pero Comentado

`VacunacionIntegratorModule` aparece importado en `app.module.ts` pero comentado, sugiriendo una integración incompleta o suspendida sin resolución explícita.

**Recomendación:** Eliminar el módulo si no está en uso, o activarlo y documentar su estado con un ticket de seguimiento.

---

## 5. Testing

### Estado Actual

| Métrica | Valor |
|---|---|
| Archivos `.spec.ts` totales | 43 |
| Archivos con aserciones reales | ~3 |
| Cobertura estimada del backend | < 1% |

Los archivos `.spec.ts` existentes son en su mayoría stubs vacíos generados por el CLI de NestJS, sin aserciones implementadas.

### Servicios Críticos sin Cobertura

- `sync.service.ts` — lógica de sincronización con DHIS2/VigiFlow
- `notificacion.service.ts` — servicio más extenso del proyecto
- `reporte.service.ts` — generación de Gacetas ESAVI
- `homologador.service.ts` — normalización de datos

### Recomendaciones

1. Implementar tests unitarios para los servicios críticos como prioridad
2. Configurar umbral mínimo de cobertura en `jest.config.js`:
   ```json
   "coverageThreshold": { "global": { "lines": 30 } }
   ```
3. Objetivo: 30% de cobertura en servicios de dominio en 2 sprints

---

## 6. Infraestructura y DevOps

### OBS-INFRA-01: Ausencia de CI/CD

No existe ninguna configuración de integración o despliegue continuo. Todos los despliegues son manuales.

**Impacto:** Sin validación automática pre-merge, sin trazabilidad de despliegues, mayor probabilidad de regresiones.

**Pipeline mínimo recomendado (GitHub Actions):**

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  ci:
    steps:
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test --coverage
      - run: pnpm build
```

---

### OBS-INFRA-02: Versionamiento de Imágenes Docker

Los Dockerfiles de producción no implementan tags semánticos. Esto dificulta el rollback ante incidentes.

**Recomendación:**

```bash
docker build -t integra-esavi/api:1.2.0-b27e0f6 .
```

---

### OBS-INFRA-03: Diferencia de Versión Node.js entre Entornos

- Dockerfile de producción: `node:18`
- Entorno de desarrollo local: `v22.13.0`

Esta discrepancia puede producir comportamiento diferente entre desarrollo y producción.

**Recomendación:** Usar `.nvmrc` y alinear el Dockerfile con la versión de desarrollo:

```
# .nvmrc
22.13.0
```

---

## 7. Documentación

### Recursos Existentes

| Recurso | Ubicación | Estado |
|---|---|---|
| README general | `workspace/README.md` | Básico |
| README API | `api-integra-esavi/README.md` | Incompleto |
| README frontend | `app-integra-esavi/README.md` | Básico |
| Observaciones técnicas API | `api-integra-esavi/docs/` | Detalladas |
| Diagramas C4 | `api-integra-esavi/docs/c4model/` | Presentes |

### Carencias Identificadas

- No existe runbook de despliegue en producción
- Sin guía de troubleshooting para sincronizaciones fallidas
- Ausencia de ERD (Entity Relationship Diagram) actualizado
- Sin guía de contribución (`CONTRIBUTING.md`)
- No hay documentación de los flujos de homologación (MedDRA, WhoDrug)
- La especificación Swagger no está exportada como artefacto estático

---

## 8. Tabla de Prioridades

### Prioridad 1 — Antes de cualquier despliegue a producción

| ID | Observación | Archivo | Esfuerzo |
|---|---|---|---|
| OBS-SEC-01 | Command Injection | `reporte.service.ts` | 2–3 h |
| OBS-SEC-02 | SQL Injection dinámico | `notificacion.service.ts` | 2–3 h |
| OBS-SEC-03 | Credenciales en repositorio | `.env` | 4–6 h |
| OBS-BUG-01 | `exist()` sin await | `sync.service.ts` | 1 h |
| OBS-BUG-02 | Métodos invertidos | `notificacion.service.ts` | 2 h |

### Prioridad 2 — Sprint siguiente

| ID | Observación | Impacto |
|---|---|---|
| OBS-COD-01 | Logging con console.log | Operabilidad |
| OBS-COD-02 | Duplicación de lógica | Mantenibilidad |
| OBS-COD-03 | ConfigService inconsistente | Confiabilidad |
| OBS-COD-05 | Exception filter no global | Consistencia API |
| OBS-SEC-04 | JWT sin validación de firma | Seguridad |

### Prioridad 3 — Mes siguiente

| ID | Observación | Impacto |
|---|---|---|
| OBS-INFRA-01 | CI/CD ausente | Calidad de release |
| Testing < 1% | Sin cobertura en servicios críticos | Confianza en cambios |
| OBS-INFRA-02 | Sin versionamiento Docker | Operabilidad |
| OBS-INFRA-03 | Node.js 18 vs 22 | Paridad dev/prod |
| Documentación | Runbook, ERD, Troubleshooting | Operabilidad |

---

## Apéndice: Archivos Clave del Proyecto

```
workspace/
├── api-integra-esavi/
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── integrator/service/sync.service.ts          <- OBS-BUG-01
│   │   ├── integrator/service/notificacion.service.ts  <- OBS-BUG-02, OBS-SEC-02
│   │   ├── integrator/service/reporte.service.ts       <- OBS-SEC-01
│   │   └── common/utils/jwt.util.ts                    <- OBS-SEC-04
│   └── docs/
│       └── c4model/
├── app-integra-esavi/
│   ├── src/
│   │   ├── pages/           (14 vistas)
│   │   └── dataProviders/   (28 providers)
│   └── docs/
│       └── observaciones-tecnicas.md  <- este archivo
└── dash-integra-esavi/
    ├── global.R
    └── app.R
```
