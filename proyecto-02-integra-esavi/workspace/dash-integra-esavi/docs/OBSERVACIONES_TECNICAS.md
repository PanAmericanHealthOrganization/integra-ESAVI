# Observaciones Técnicas — dash-integra-esavi

**Fecha:** 2026-06-26
**Revisado por:** Análisis automatizado del código fuente

---

## 1. Problemas Críticos

### 1.1 `server.R` monolítico (6,472 líneas)
- Contiene 100+ funciones `tbl_*`, toda la lógica reactiva y todos los `output$` en un único archivo
- Imposible de mantener y debugear a esta escala
- Las funciones helper definidas dentro de `server()` no son reutilizables desde otros módulos
- **Acción recomendada:** Dividir en módulos Shiny separados

  | Módulo propuesto | Contenido |
  |---|---|
  | `mod_filtros.R` | Gestión del estado de filtros y resets |
  | `mod_kpis.R` | Cálculo y renderizado de indicadores |
  | `mod_descriptivo.R` | Análisis descriptivo general |
  | `mod_vacunas.R` | Análisis por vacuna |
  | `mod_eventos.R` | Análisis por evento adverso |
  | `mod_senales.R` | Detección de señales (PRR, ROR, BCPNN) |
  | `utils/graphics.R` | Funciones `tbl_*` reutilizables |
  | `utils/data.R` | Funciones de procesamiento de datos |

### 1.2 `geo_datos.rds` vacío (0 bytes)
- Ubicación: `datos/geo_datos.rds`
- El archivo existe pero no tiene contenido
- Provoca que todos los mapas corográficos retornen `NULL` silenciosamente
- Las funciones `tbl_mapa()` (server.R línea 1151) y el output de mapas fallan sin error visible
- **Acción recomendada:** Regenerar desde la fuente original (PostgreSQL o shapefile)

### 1.3 Token de autenticación expuesto en URL
- El mecanismo actual pasa el token como query string: `?token=xxxxx`
- El token queda registrado en los logs del servidor web y en el historial del navegador
- **Acción recomendada:** Migrar a header HTTP (`Authorization: Bearer`) o cookie HttpOnly

### 1.4 Token hardcodeado en código fuente
- `auth_config.R` línea 12 contiene un token SHA-256 literal en el código
- Aunque se soportan tokens por variable de entorno (`DASHBOARD_AUTH_TOKENS`), el token embebido persiste
- **Acción recomendada:** Eliminar el token hardcodeado; usar únicamente variables de entorno

### 1.5 Sin cobertura de tests
- No existe carpeta `tests/` ni archivos `testthat`
- Las funciones estadísticas críticas (PRR, ROR, BCPNN) no tienen verificación automática
- Los filtros reactivos no tienen pruebas de regresión
- **Acción recomendada:** Implementar `testthat` para funciones en `global.R` y `utils/`

---

## 2. Problemas de Alta Prioridad

### 2.1 Error handling silencioso
- Los `tryCatch()` en server.R retornan `NULL` o `0` sin logging útil
- Ejemplo (server.R línea 237):
  ```r
  tryCatch({
    vdosis1 <- length(unique(datos[...]))
  }, error = function(e) {
    vdosis1 <<- 0  # El usuario no sabe que falló
    warning("Error: ", e$message)
  })
  ```
- **Acción recomendada:** Registrar errores en un log estructurado y mostrar advertencia visible en la UI

### 2.2 `global.R` con responsabilidades mezcladas (805 líneas)
- Mezcla: paleta de colores, formatos de tablas, funciones estadísticas, carga de datos y configuración de filtros
- **Acción recomendada:** Separar en archivos por responsabilidad:
  ```
  global.R            ← solo punto de carga (source())
  utils/colors.R      ← paletas y variables de color
  utils/formatters.R  ← format_num(), format_percent()
  utils/statistics.R  ← apply_PRR_C1(), apply_ROR_C1(), apply_BCPNN_*()
  utils/data.R        ← load_data(), filtros_config
  ```

### 2.3 Variables de color sin estructura (`vColor1`...`vColor27`)
- 27 variables globales nombradas secuencialmente en `global.R` líneas 600+
- Sin semántica: no se puede saber qué representa `vColor14`
- **Acción recomendada:**
  ```r
  # En lugar de:
  vColor1 <- "#1f77b4"
  vColor2 <- "#2ca02c"

  # Usar:
  colores <- list(
    primario  = "#1f77b4",
    exito     = "#2ca02c",
    advertencia = "#ff7f0e"
  )
  ```

### 2.4 Funciones `tbl_*` duplicadas sin abstracción
- 100+ funciones siguen el mismo patrón: filtrar → agrupar → graficar
- No hay función base que parametrice el comportamiento común
- **Acción recomendada:** Crear una función genérica y especializar por parámetros

### 2.5 `datos_filtrados` reactive de 200+ líneas (server.R línea 209)
- Toda la lógica de filtrado en un solo reactive
- Difícil de testear y debugear
- **Acción recomendada:** Extraer sub-reactivos por tipo de filtro

### 2.6 HTTPS no forzado
- `.env` configura `SHINY_HOST=0.0.0.0` sin requerir HTTPS
- El token y los datos epidemiológicos viajan sin cifrado si no hay proxy SSL
- **Acción recomendada:** Documentar o forzar el uso de un reverse proxy con TLS (nginx/caddy)

---

## 3. Problemas de Prioridad Media

### 3.1 Statements de debug en producción
- `print()` dejados en server.R (líneas 151, 155 y otros)
- Generan ruido en logs de producción
- **Acción:** Eliminar o reemplazar con `message()` / `logger`

### 3.2 Sin documentación de funciones (roxygen2)
- Ninguna función tiene `@param`, `@return` ni `@examples`
- Dificulta el onboarding de nuevos desarrolladores
- **Acción recomendada:** Documentar al menos las funciones en `global.R` y `utils/`

### 3.3 Parámetros de función sin valores por defecto
- `procesarDatosGraficos()` (server.R línea 854) recibe 8 parámetros sin defaults
- Fácil de llamar incorrectamente
- **Acción:** Agregar `= NULL` o valores por defecto a parámetros opcionales

### 3.4 `filtros_config` con filtros comentados/deshabilitados
- `global.R` línea 770+ contiene filtros comentados (semana epidemiológica, grupo etario, sexo, municipio, vacuna, MedDRA)
- No está claro si son filtros en desarrollo o eliminados permanentemente
- **Acción:** Documentar intención o eliminar si ya no aplican

---

## 4. Fortalezas a preservar

- Uso correcto de `renv` para reproducibilidad del entorno R
- Arquitectura de filtros configurable (`filtros_config` como diccionario en `global.R`)
- Funciones helper de KPIs reutilizables (`f_dash_kpis_box`, `f_general_kpis_box`, etc.)
- Implementación estadística correcta de PRR, ROR y BCPNN con `PhViD`
- Separación de autenticación en archivos propios (`auth_config.R`, `auth_ui.R`, `server_auth.R`)
- Variables de entorno para configuración sensible (`.env` + `.env.example`)
- Logging de intentos de acceso (`log_access_attempt()`)

---

## 5. Plan de acción sugerido

### Fase 1 — Correcciones bloqueantes (1-2 días)
- [ ] Regenerar `datos/geo_datos.rds` desde fuente original
- [ ] Eliminar token hardcodeado de `auth_config.R`
- [ ] Eliminar `print()` de debug de server.R

### Fase 2 — Seguridad (3-5 días)
- [ ] Implementar HTTPS obligatorio a nivel de documentación/infraestructura
- [ ] Evaluar migración de token de URL a cookie HttpOnly o header Authorization
- [ ] Revisar `.gitignore` para asegurar que `.env` no esté versionado

### Fase 3 — Calidad de código (1-2 semanas)
- [ ] Extraer `utils/colors.R`, `utils/formatters.R`, `utils/statistics.R` de `global.R`
- [ ] Mejorar `tryCatch()` para incluir logging estructurado
- [ ] Abstraer patrón común de funciones `tbl_*`
- [ ] Documentar funciones estadísticas con roxygen2

### Fase 4 — Refactorización mayor (2-3 semanas)
- [ ] Dividir `server.R` en módulos Shiny (`mod_filtros.R`, `mod_kpis.R`, etc.)
- [ ] Implementar tests con `testthat` para funciones estadísticas
- [ ] Dividir `ui.R` en archivos por sección

---

## 6. Métricas del código (estado actual)

| Archivo | Líneas | Observación |
|---|---|---|
| `server.R` | 6,472 | Monolítico — refactorización urgente |
| `ui.R` | 2,323 | Grande — dividir por sección |
| `global.R` | 805 | Responsabilidades mezcladas |
| `preparar_datos.R` | 241 | Aceptable |
| `generar_tokens.R` | 161 | Aceptable |
| `auth_ui.R` | 135 | Aceptable |
| `auth_config.R` | 78 | Aceptable |
| `server_auth.R` | 88 | Aceptable |
| `app.R` | 65 | Aceptable |
| **Total** | **~10,700** | |

| Dato | Valor |
|---|---|
| Funciones `tbl_*` | 100+ |
| Outputs `output$` | 80+ |
| Librerías R importadas | 30+ |
| Paquetes en renv.lock | 150+ |
| Cobertura de tests | 0% |
| Archivos de datos rotos | 1 (`geo_datos.rds`) |
