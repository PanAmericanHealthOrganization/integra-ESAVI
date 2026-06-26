# Observaciones Técnicas — `api-integra-esavi`

**Fecha:** 2026-06-26
**Stack:** NestJS 11 · TypeORM 0.3 · PostgreSQL / Oracle · TypeScript 5.9
**Archivos fuente analizados:** 292

---

## 1. Correctitud / Bugs

| # | Severidad | Archivo(s) | Observación |
|---|-----------|-----------|-------------|
| 1 | **Alta** | `src/integrator/service/sync.service.ts:27-32` | `exist()` nunca hace `await` al `findOne`. La promesa siempre es *truthy*, por lo que el método retorna `true` incondicionalmente sin importar si el registro existe. |
| 2 | **Alta** | `src/integrator/service/notificacion-dhis2.service.ts:107-109` | El bloque `catch` de la actualización solo imprime `'Error en actualización'` y continúa sin retornar ni relanzar; la función retorna `undefined` silenciosamente cuando falla el update. |
| 3 | **Alta** | `src/integrator/service/notificacion-vigiflow.service.ts:159-197` | `calcularEdad()` puede retornar `undefined` cuando `meses < 0` (se llega al final sin `return`), lo que provocaría un crash al intentar acceder a `.edadCalculada`. |
| 4 | **Media** | `src/integrator/service/notificacion.service.ts:76-83` | Los métodos `findAntecedenteEmbarazoByNotificacionUUID` y `findAntecedenteMedicoByNotificacionUUID` están **invertidos** — cada uno delega al servicio del otro. |
| 5 | **Media** | `src/integrator/service/reporte.service.ts:134-143` | `casosEsaviPorSexoNoGrave()` usa exactamente la misma query que `casosEsaviPorSexoGrave()` (ambas filtran `TIPO_GRAVEDAD = 'GRAVE'`), produciendo resultados idénticos. |
| 6 | **Baja** | `src/integrator/service/notificacion-dhis2.service.ts:251-263` | `updateByCodigoDhis2Evento` acepta `updateData: any` y usa `Object.assign` sobre la entidad, saltando toda validación de campos; puede corromper datos con claves arbitrarias. |

---

## 2. Seguridad

| # | Severidad | Archivo(s) | Observación |
|---|-----------|-----------|-------------|
| 7 | **Alta** | `src/integrator/service/reporte.service.ts:6,51-55,72` | Uso de `child_process.exec` con un comando que incluye `process.env.DIR_PDF` sin sanitizar. Si `DIR_PDF` contiene metacaracteres de shell, es susceptible a **command injection**. Migrar a `execFile` o `spawn` con argumentos separados. |
| 8 | **Alta** | `src/integrator/service/notificacion.service.ts:128-133` | En `findAllPaginated`, el filtro genérico construye nombres de columna directamente desde la entrada del cliente (`notificacion.${key}`). Un `key` malicioso puede producir queries inesperadas o exponer columnas no previstas. |
| 9 | **Media** | `src/common/utils/jwt.util.ts` | El JWT se decodifica manualmente con `Buffer.from(base64, 'base64')` sin verificar la firma. Solo debe usarse para extraer `preferred_username` en contextos informativos, nunca para decisiones de autorización. |
| 10 | **Baja** | `src/providers/http-exception.filter.ts:45-46` | La respuesta de error expone `request.body.ent_id` y `request.body.usr_usuario` sin filtrar; en errores 500 esto puede incluir datos sensibles del payload original. |

---

## 3. Calidad / Mantenibilidad

| # | Prioridad | Archivo(s) | Observación |
|---|-----------|-----------|-------------|
| 11 | Alta | `notificacion-dhis2.service.ts`, `notificacion-vigiflow.service.ts` | `findParroquiaByCodigo` (código idéntico) y `calcularEdad` están **duplicados** en ambos servicios. Extraer a un servicio/util compartido. |
| 12 | Alta | `src/integrator/service/notificacion-dhis2.service.ts` | Más de 170 líneas de código de producción **comentado** (método `create()` antiguo completo). Eliminar; el historial está en git. |
| 13 | Alta | 17 servicios | `process.env.USUARIO_INSERTA_REGISTRO` se lee directamente en tiempo de ejecución en lugar de inyectarse vía `ConfigService`. Si la variable no está definida el valor es `undefined` sin fallback en varios lugares. |
| 14 | Media | `homologador.service.ts:13`, `regla-homologacion.service.ts:13`, `gaceta.service.ts:40` | `UUID_REGEX` definido tres veces con código copia-pega. Centralizar en `src/utils`. |
| 15 | Media | `src/integrator/service/sync.service.ts:101-118` | `getMany()` usa `console.log`/`console.error` en lugar del `Logger` de NestJS ya disponible en otros servicios del mismo módulo. |
| 16 | Media | `src/app.module.ts:23` | `VacunacionIntegratorModule` está comentado con credenciales Oracle pendientes, pero el `import` permanece activo (dead import). Documentar con un ticket o eliminar la importación hasta que esté listo. |
| 17 | Media | Todo el proyecto | **177 ocurrencias** de `console.log/error/warn` dispersas en servicios de producción. Reemplazar con el `Logger` inyectado de NestJS para control de nivel, contexto y transporte estructurado. |
| 18 | Baja | `src/providers/http-exception.filter.ts` | El filtro solo está aplicado con `@UseFilters` en 2 controladores. La mayoría de endpoints no tienen manejo de errores consistente. Registrar como filtro global en `main.ts` con `app.useGlobalFilters()`. |
| 19 | Baja | `notificacion-vigiflow.service.ts:80-148`, `notificacion-dhis2.service.ts:349-402` | Lógica de conversión de unidades de edad duplicada con constantes ligeramente distintas (ej. `4.3452` vs sin especificar). Crear un `AgeCalculatorUtil` compartido con una única fuente de verdad. |
| 20 | Baja | `src/integrator/service/reporte.service.ts:1-7` | Usa `require('child_process')` y `require('fs')` (CommonJS) en lugar de los imports ES module ya usados en el resto del proyecto (`import * as fs from 'fs/promises'`). |

---

## 4. Cobertura de Pruebas

| # | Prioridad | Observación |
|---|-----------|-------------|
| 21 | Alta | Solo **3 archivos `.spec.ts`** en `src/` para 292 archivos fuente (~1% de cobertura). Los servicios críticos (`notificacion`, `paciente`, `dhis2-integrator`, `vigiflow-integrator`) no tienen tests unitarios. |
| 22 | Media | Los tests en `test/` (e2e) son stubs vacíos (`vigiflow-integrador.controller.spec.ts`, `vigiflow-integrador.service.spec.ts`) sin aserciones reales. |

---

## Resumen Ejecutivo

| Categoria | Criticos | Altos | Medios | Bajos |
|-----------|----------|-------|--------|-------|
| Correctitud | — | 3 | 2 | 1 |
| Seguridad | — | 2 | 1 | 1 |
| Calidad | — | 3 | 4 | 3 |
| Pruebas | — | 1 | 1 | — |

**Prioridades inmediatas:**

1. **#1** — Bug `exist()` sin `await` en `sync.service.ts` (siempre retorna `true`)
2. **#4** — Métodos de antecedentes invertidos en `notificacion.service.ts`
3. **#7** — Riesgo de command injection en `reporte.service.ts`
4. **#8** — Columnas dinámicas en query builder expuestas a entrada del cliente
5. **#11** — Duplicación de lógica crítica (`calcularEdad`, `findParroquiaByCodigo`)
