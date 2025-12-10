# Informe ESAVI - Estructura de Secciones

Este directorio contiene la estructura modular y organizada del informe ESAVI, diseñada para facilitar el mantenimiento, colaboración y reutilización de componentes.

## 📁 Estructura Actual (Sin Duplicados)

```
secciones/
├── 📂 00_estructura/          # Elementos estructurales del documento
│   ├── 00_portada.Rmd        # Portada del informe
│   ├── 01_indice.Rmd         # Índice del documento
│   └── 02_resumen_ejecutivo.Rmd  # Resumen ejecutivo
├── 📂 01_introduccion/        # Sección de introducción
│   └── 01_introduccion.Rmd   # Antecedentes, justificación y objetivos
├── 📂 02_metodologia/         # Sección de metodología
│   └── 01_metodologia.Rmd    # Diseño, población, variables y análisis
├── 📂 03_resultados/          # Sección de resultados
│   ├── 00_resultados.Rmd     # Archivo maestro de resultados
│   ├── 01_caracteristicas_poblacion.Rmd  # Características generales
│   ├── 02_distribucion_geografica.Rmd    # Análisis geográfico
│   ├── 03_analisis_vacunas.Rmd           # Análisis por vacuna
│   ├── 04_analisis_gravedad.Rmd          # Análisis de gravedad
│   └── 05_analisis_temporal.Rmd          # Análisis temporal
├── 📂 04_conclusiones/        # Sección de conclusiones
│   └── 01_conclusiones.Rmd   # Conclusiones y recomendaciones
├── 📄 load_data.Rmd           # 🔧 Carga de datos (nivel raíz)
├── 📄 desarrollo.Rmd          # Archivo original (respaldo)
├── 📄 informe_completo.Rmd    # 🎯 Archivo maestro principal
└── 📄 README.md               # Esta documentación
```

## 🎯 Archivo Maestro Principal

### Informe Completo
```r
# Para generar el informe completo con toda la estructura
```{r child = "secciones/informe_completo.Rmd"}
```

### Carga de Datos (Separada)
```r
# Para cargar solo los datos y variables globales
```{r child = "secciones/load_data.Rmd"}
```

### Archivos Específicos por Sección
```r
# Solo introducción
```{r child = "secciones/01_introduccion/01_introduccion.Rmd"}
```

# Solo metodología
```{r child = "secciones/02_metodologia/01_metodologia.Rmd"}
```

# Solo resultados completos
```{r child = "secciones/03_resultados/00_resultados.Rmd"}
```

# Solo conclusiones
```{r child = "secciones/04_conclusiones/01_conclusiones.Rmd"}
```

### Subsecciones Específicas de Resultados
```r
# Solo características de población
```{r child = "secciones/03_resultados/01_caracteristicas_poblacion.Rmd"}
```

# Solo análisis geográfico
```{r child = "secciones/03_resultados/02_distribucion_geografica.Rmd"}
```

# Solo análisis de vacunas
```{r child = "secciones/03_resultados/03_analisis_vacunas.Rmd"}
```

# Solo análisis de gravedad
```{r child = "secciones/03_resultados/04_analisis_gravedad.Rmd"}
```

# Solo análisis temporal
```{r child = "secciones/03_resultados/05_analisis_temporal.Rmd"}
```

### Elementos Estructurales
```r
# Portada
```{r child = "secciones/00_estructura/00_portada.Rmd"}
```

# Carga de datos (ahora en nivel raíz)
```{r child = "secciones/load_data.Rmd"}
```

## 🔢 Sistema de Numeración

La numeración refleja el **orden de aparición** en el informe final:

- **00_** = Elementos estructurales (antes del contenido principal)
- **01_** = Primera sección principal (Introducción)  
- **02_** = Segunda sección principal (Metodología)
- **03_** = Tercera sección principal (Resultados)
- **04_** = Cuarta sección principal (Conclusiones)

Dentro de cada carpeta, los archivos mantienen el orden lógico de las subsecciones.

## ✅ Ventajas de esta Estructura

1. **🚫 Sin duplicación** - Cada archivo existe en una sola ubicación
2. **📋 Estructura clara** - Numeración que refleja orden de aparición
3. **🔧 Fácil mantenimiento** - Un solo lugar para editar cada sección
4. **📁 Organización lógica** - Carpetas por sección principal
5. **🎛️ Flexibilidad** - Fácil inclusión de secciones específicas
6. **📈 Escalabilidad** - Simple agregar nuevas subsecciones
7. **👥 Mejor colaboración** - Equipos pueden trabajar en carpetas específicas
8. **🔄 Control de versiones** - Cambios aislados por sección

## 📊 Estadísticas

- **Total archivos:** 16
- **Carpetas organizadas:** 5 
- **Archivo maestro principal:** 1 (`informe_completo.Rmd`)
- **Archivo de carga:** 1 (`load_data.Rmd` en nivel raíz)
- **Archivos de respaldo:** 1 (`desarrollo.Rmd`)
- **Archivos redundantes eliminados:** 2

## 🔄 Evolución de la Estructura

### Versión 1: Archivo Único
- `desarrollo.Rmd` - Un solo archivo con todo el contenido

### Versión 2: Estructura Modular
- Separación en archivos individuales por sección
- Uso de `child` para incluir secciones

### Versión 3: Estructura Organizada (Actual)
- Organización en carpetas numeradas
- Eliminación de duplicados
- Archivos maestros para diferentes usos

## 🛠️ Recomendaciones de Uso

1. **Para informe final:** Usar `informe_completo.Rmd`
2. **Para carga de datos:** `load_data.Rmd` está en nivel raíz para fácil acceso
3. **Para edición:** Trabajar directamente en archivos de carpetas
4. **Para nuevas secciones:** Mantener la numeración secuencial
5. **Para colaboración:** Asignar carpetas específicas a diferentes equipos

## 🔒 Archivos de Respaldo

El siguiente archivo se mantiene como respaldo:
- `desarrollo.Rmd` - Archivo original completo

## 📝 Notas Importantes

- Los datos se cargan desde `00_estructura/03_load_data.Rmd`
- Cada archivo debe ser autosuficiente en términos de librerías
- Las rutas en `child` son relativas al directorio `secciones/`
- Mantener consistencia en formato y estilo entre archivos