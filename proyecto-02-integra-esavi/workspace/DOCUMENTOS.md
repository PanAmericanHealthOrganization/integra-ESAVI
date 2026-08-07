# Índice de documentos Word (.docx) — Integra-ESAVI

Inventario de todos los archivos `.docx` presentes en los proyectos de `integra-ESAVI`.
Los enlaces son relativos a este archivo (`proyecto-02-integra-esavi/workspace/DOCUMENTOS.md`); en GitHub/VS Code abren o descargan el documento directamente.

- **Total:** 16 documentos (13 únicos + 3 copias idénticas)
- **Repositorio:** `git@github.com:PanAmericanHealthOrganization/integra-ESAVI.git`
- **Última revisión del inventario:** 2026-08-07

> Se excluyen los `.docx` de ejemplo incluidos en las librerías de R (`dash-integra-esavi/renv/library/...` — paquetes `officer`, `officedown`, `doconv`), que no son documentación del proyecto.

---

## 1. Documentación transversal — `workspace/docs/`

Documentación de la solución completa (API + App + Dashboard).

| Documento | Descripción | Versión / Fecha | Tamaño |
|---|---|---|---|
| [Manual-Desarrollador.docx](docs/Manual-Desarrollador.docx) | Guía de onboarding para nuevos desarrolladores: stack tecnológico de los tres subproyectos, requisitos del entorno, Dockerfiles y docker-compose por subproyecto, conexión a la BD con DBeaver, variables de entorno `.env` de cada componente y comandos del día a día. | — | 42 KB |
| [Despliegue-Integra-ESAVI.docx](docs/Despliegue-Integra-ESAVI.docx) | Manual de despliegue del stack completo con Docker Compose (PostgreSQL + Keycloak + API + App + Dashboard) en ambiente de desarrollo local. Incluye el `docker-compose.yaml` completo, volúmenes compartidos, respaldo de BD, tabla de parámetros `TC_PARAMETRO`, configuración opcional de oauth2-proxy/TLS y verificación post-despliegue. | 22/07/2026 — Desarrollo | 41 KB |
| [Manual-Despliegue-Produccion.docx](docs/Manual-Despliegue-Produccion.docx) | Despliegue a producción con PM2 en el host (API NestJS + App React) y Dashboard Shiny en Docker aparte, con Postgres y Keycloak como servicios externos. Cubre primera instalación, publicación de nuevas versiones, rollback, credenciales externas a solicitar (MedDRA, WHODrug, VigiFlow) y checklist de Go-Live. | — | 32 KB |

## 2. `api-integra-esavi` — Backend NestJS

| Documento | Descripción | Versión / Fecha | Tamaño |
|---|---|---|---|
| [Base-de-Datos.docx](api-integra-esavi/docs/Base-de-Datos.docx) | Diccionario de datos del esquema `DHI_ESAVI`: descripción tabla por tabla (`TR_NOTIFICACION`, `TR_DATOS_ESAVI`, `TR_DATO_VACUNA`, `TR_CAUSALIDAD_ESAVI`, `TR_ANTECEDENTES_*`, `TG_GACETA`, catálogos `TC_*`, etc.) y de la clase base de `Auditoria`. Es el documento más extenso del repositorio (~1.800 párrafos). | — | 67 KB |

## 3. `app-integra-esavi` — Frontend React

| Documento | Descripción | Versión / Fecha | Tamaño |
|---|---|---|---|
| [Manual-Usuario-Admin.docx](app-integra-esavi/docs/Manual-Usuario-Admin.docx) | Manual de usuario del rol **Administrador**: inicio de sesión, navegación y secciones exclusivas de admin (Parámetros, Catálogos, DPA, Establecimientos, Homologación, Administración), más las secciones generales (ESAVIS, Análisis, Vacunómetro, Calidad de Datos, Sincronizaciones, Gaceta, MedDRA/WHODrug, Dashboard) y buenas prácticas. | Versión resumida | 34 KB |

## 4. `dash-integra-esavi` — Dashboard R Shiny

| Documento | Descripción | Versión / Fecha | Tamaño |
|---|---|---|---|
| [MANUAL_USUARIO_INTEGRA_ESAVI.docx](dash-integra-esavi/docs/MANUAL_USUARIO_INTEGRA_ESAVI.docx) | Manual de usuario del Dashboard: módulos de **Análisis de Calidad de Datos** (dimensiones semántica, sintáctica y temporal, con sus páginas de visualización) y **Análisis de Datos**. Incluye propósito, alcance, glosario y capturas de pantalla (por eso pesa ~3,9 MB). | v1.0 — Enero 2025 | 3,9 MB |
| [MANUAL-INSTALACION.DASH-INTEGRA-ESAVI.docx](dash-integra-esavi/docs/MANUAL-INSTALACION.DASH-INTEGRA-ESAVI.docx) | Manual técnico de instalación del Dashboard R Shiny sobre **AlmaLinux**: requerimientos mínimos, proceso de instalación, configuración del proyecto, despliegue como servicio `systemd` y hoja de firmas/aprobaciones. Dirigido a administradores de sistemas. | v1.0 — 2025 | 25 KB |
| [USUARIOS_CONCURRENCIA.DASH-INTEGRA-ESAVI.docx](dash-integra-esavi/docs/USUARIOS_CONCURRENCIA.DASH-INTEGRA-ESAVI.docx) | Análisis de perfiles de usuario y concurrencia para dimensionar la infraestructura: base de **2.496 usuarios activos**, caracterización de roles, cálculo de concurrencia en condiciones normales y de pico, recomendaciones de dimensionamiento y monitoreo. | v1.0 — Diciembre 2025 | 20 KB |

## 5. `proyecto-02-integra-esavi/docs/manuales/` — Manuales institucionales

Documentos con formato oficial del Ministerio de Salud Pública del Ecuador, fuera del `workspace`.

| Documento | Descripción | Versión / Fecha | Tamaño |
|---|---|---|---|
| [ARQUITECTURA_INTEGRA_ESAVI.docx](../docs/manuales/ARQUITECTURA_INTEGRA_ESAVI.docx) | **Documento de arquitectura vigente.** Plataforma de integración ESAVI (API NestJS, Web React, Dashboard Shiny): propósito, alcance, glosario, proceso de datos (prerrequisitos y datos maestros, captura y sincronización, trazabilidad/auditoría del módulo Sync, ciclo de procesamiento), vista de contexto y de componentes (`integra-esavi-api`, `-dash`, `-gaceta`, `-web`) y tecnologías por capa. | v2.0 — 2026 | 42 KB |
| [ARQUITECTURA_INTEGRA_ESAVI.v1.backup.docx](../docs/manuales/ARQUITECTURA_INTEGRA_ESAVI.v1.backup.docx) | Respaldo de la versión anterior del documento de arquitectura, centrada en el Dashboard R Shiny sobre AlmaLinux. Conservar solo como histórico. | v1.0 — 2025 | 241 KB |
| [MANUAL_USUARIO.docx](../docs/manuales/MANUAL_USUARIO.docx) | Portada rotulada "INTEGRA ESAVI — Manual de Usuario", pero su contenido reproduce el del documento de arquitectura v1 (mismo índice, glosario y objetivos de instalación del Dashboard). Ver observación al final. | v1.0 — 2025 | 367 KB |
| [20260309-SIE-API-Manual-Instalacion-MODO-DESPLIEGUE.docx](../docs/manuales/tecnicos-despliegue/20260309-SIE-API-Manual-Instalacion-MODO-DESPLIEGUE.docx) | Manual técnico de instalación de la **API** en AlmaLinux: NVM + Node.js v20.16.0 + pnpm, creación del usuario `integraesavi` y del directorio `/opt/apps`, permisos, clonación del repositorio, instalación de dependencias y despliegue como servicio `systemd`. | v1.0 — 09/03/2026 | 293 KB |
| [20260424-sie-app-manual-instalacion-MODO-DESPLIEGUE.docx](../docs/manuales/tecnicos-despliegue/20260424-sie-app-manual-instalacion-MODO-DESPLIEGUE.docx) | Equivalente al anterior para la **APP** web en AlmaLinux: mismo procedimiento de entorno (NVM, Node, pnpm, usuario y permisos), build de la aplicación y publicación como servicio `systemd`. | v1.0 — 24/04/2026 | 283 KB |

## 6. `proyecto-03-analitica/docs/` — Copias del proyecto de analítica

Los tres archivos son **copias byte a byte** (mismo MD5) de los de `dash-integra-esavi/docs/`.

| Documento | Copia idéntica de | Tamaño |
|---|---|---|
| [MANUAL_USUARIO_INTEGRA_ESAVI.docx](../../proyecto-03-analitica/docs/MANUAL_USUARIO_INTEGRA_ESAVI.docx) | `dash-integra-esavi/docs/MANUAL_USUARIO_INTEGRA_ESAVI.docx` | 3,9 MB |
| [MANUAL-INSTALACION.DASH-INTEGRA-ESAVI.docx](../../proyecto-03-analitica/docs/MANUAL-INSTALACION.DASH-INTEGRA-ESAVI.docx) | `dash-integra-esavi/docs/MANUAL-INSTALACION.DASH-INTEGRA-ESAVI.docx` | 25 KB |
| [USUARIOS_CONCURRENCIA.DASH-INTEGRA-ESAVI.docx](../../proyecto-03-analitica/docs/USUARIOS_CONCURRENCIA.DASH-INTEGRA-ESAVI.docx) | `dash-integra-esavi/docs/USUARIOS_CONCURRENCIA.DASH-INTEGRA-ESAVI.docx` | 20 KB |

---

## Observaciones de mantenimiento

1. **Duplicados exactos.** Los tres documentos de `proyecto-03-analitica/docs/` son idénticos (verificado por MD5) a los de `dash-integra-esavi/docs/`. Conviene dejar una única fuente y referenciarla desde el otro proyecto para evitar que se desincronicen.
2. **`MANUAL_USUARIO.docx` mal rotulado.** El archivo de `docs/manuales/` tiene portada de manual de usuario pero contenido del documento de arquitectura v1 (idénticos índice, glosario y objetivos). Debería reemplazarse por el manual de usuario real o renombrarse.
3. **Archivo temporal versionado.** `app-integra-esavi/docs/~$nual-Usuario-Admin.docx` es un archivo de bloqueo de Word que quedó registrado en Git; conviene eliminarlo y agregar `~$*.docx` al `.gitignore`.
4. **Documentos fuera de `workspace/`.** Los manuales institucionales (`proyecto-02-integra-esavi/docs/manuales/`) y las copias de `proyecto-03-analitica/` viven fuera del `workspace`, aunque pertenecen al mismo repositorio Git.
