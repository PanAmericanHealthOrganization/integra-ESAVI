# 📊 Informe ESAVI - Sistema de Renderizado

Este repositorio contiene el sistema completo para generar informes de análisis de Eventos Supuestamente Atribuidos a Vacunación o Inmunización (ESAVI).

## 📁 Estructura del Proyecto

```
gaceta-integra-esavi/
├── informe.Rmd                 # Archivo principal del informe
├── secciones/                  # Secciones del informe
│   ├── portada.Rmd            # Portada en página única
│   ├── resumen_ejecutivo.Rmd  # Resumen ejecutivo
│   ├── indice.Rmd             # Tablas de contenido y glosarios
│   ├── desarrollo.Rmd         # Metodología y resultados
│   └── conclusiones.Rmd       # Conclusiones
├── images/                    # Imágenes y figuras
│   └── logos/                 # Logos institucionales
│       ├── escudo_ecuador.png # Escudo nacional (portada)
│       ├── logo_cabecera.jpg  # Logo cabecera izquierda
│       ├── logo_msp.jpg       # Logo cabecera derecha
│       ├── logo_msp2.jpg      # Logo pie de página
│       └── logo_msp_3.png     # Logo MSP (portada)
├── output/                    # Archivos generados (se crea automáticamente)
├── logs/                      # 📝 Logs de renderizado
├── data/                      # Datos para análisis
│   └── parametros.json        # 🆕 Configuración dinámica de autores e info
├── header.tex                 # Configuraciones LaTeX adicionales
├── renderizar_informe.sh      # Script principal de renderizado
├── render_simple.sh           # Script simple para uso rápido
└── README.md                  # Este archivo
```

## 🚀 Uso Rápido

### Opción 1: Script Simple (Recomendado para uso diario)

```bash
# Generar informe en PDF (por defecto)
./render_simple.sh

# Generar en formato específico  
./render_simple.sh pdf   # 📝 Genera log automático + limpia archivos auxiliares
./render_simple.sh html  # 📝 Genera log automático + limpia archivos auxiliares  
./render_simple.sh word  # 📝 Genera log automático + limpia archivos auxiliares
```

### Opción 2: Script Completo (Para uso avanzado)

```bash
# Ver ayuda completa
./renderizar_informe.sh --help

# Generar PDF básico (con logs automáticos y limpieza)
./renderizar_informe.sh pdf

# Generar HTML con opciones avanzadas
./renderizar_informe.sh html --verbose --open --log

# Generar todos los formatos
./renderizar_informe.sh todos --log --clean

# Generar con limpieza previa y abrir automáticamente
./renderizar_informe.sh pdf --clean --open --verbose
```

## 📋 Opciones del Script Principal

| Opción          | Descripción                    |
| --------------- | ------------------------------ |
| `pdf`           | Genera informe en formato PDF  |
| `html`          | Genera informe en formato HTML |
| `word`          | Genera informe en formato Word |
| `todos`         | Genera todos los formatos      |
| `-v, --verbose` | Modo detallado                 |
| `-l, --log`     | Guarda log detallado           |
| `-o, --open`    | Abre archivo automáticamente   |
| `-c, --clean`   | Limpia archivos temporales     |
| `-h, --help`    | Muestra ayuda                  |

## 🔧 Requisitos del Sistema

### Software Necesario

1. **R** (versión 4.0+)
2. **RStudio** (recomendado)
3. **Pandoc** (incluido con RStudio)
4. **LaTeX** (para PDF - se puede instalar TinyTeX)

### Paquetes de R Requeridos

```r
install.packages(c(
  "rmarkdown",
  "knitr", 
  "kableExtra",
  "ggplot2",
  "dplyr",
  "lubridate",
  "scales",
  "readr",
  "tidyr",
  "stringr",
  "gridExtra",
  "jsonlite"
))
```

### Instalación de TinyTeX (para PDF)

```r
install.packages("tinytex")
tinytex::install_tinytex()
```

## 📋 Configuración Dinámica de Parámetros

### 🆕 Sistema de Parámetros JSON

El informe utiliza el archivo `data/parametros.json` para gestionar dinámicamente la información de autores e institucional en la portada:

#### Estructura Completa del archivo `data/parametros.json`:

```json
{
  "informe": {
    "titulo": "Informe de Análisis ESAVI",
    "subtitulo": "Gaceta Integrada de Eventos Supuestamente Atribuidos a Vacunación o Inmunización",
    "version": "1.0",
    "estado": "Final"
  },
  "autor": {
    "nombre": "Dr. Rolando Casigña",
    "cargo": "Epidemiólogo Principal",
    "correo": "rolo1410@msp.gob.ec",
    "telefono": "+593-2-123456789"
  },
  "co_autor": {
    "nombre": "Dra. Ana María González",
    "cargo": "Coordinadora de Vigilancia",
    "correo": "ana.gonzalez@msp.gob.ec",
    "telefono": "+593-2-987654321"
  },
  "institucion": {
    "nombre": "Ministerio de Salud Pública",
    "direccion": "Dirección Nacional de Vigilancia Epidemiológica",
    "pais": "Ecuador"
  },
  "descripcion": "Repositorio para la generación de la Gaceta de Eventos Supuestamente Atribuidos a Vacunación o Inmunización"
}
```

### 📝 Descripción de Campos de Parámetros

#### Sección "informe"
- **titulo**: Título principal del informe que aparece en la portada
- **subtitulo**: Subtítulo explicativo del documento
- **version**: Número de versión del informe
- **estado**: Estado actual del documento (Borrador, Revisión, Final, etc.)

#### Sección "autor"
- **nombre**: Nombre completo del autor principal (incluir títulos profesionales)
- **cargo**: Cargo o posición del autor en la institución
- **correo**: Dirección de correo electrónico institucional
- **telefono**: Número de teléfono de contacto

#### Sección "co_autor"
- **nombre**: Nombre completo del co-autor (incluir títulos profesionales)
- **cargo**: Cargo o posición del co-autor en la institución
- **correo**: Dirección de correo electrónico institucional
- **telefono**: Número de teléfono de contacto

#### Sección "institucion"
- **nombre**: Nombre oficial de la institución
- **direccion**: Dirección específica o departamento
- **pais**: País de la institución

### 🔧 Cómo Modificar los Parámetros

#### 1. Edición Manual
Abra el archivo `data/parametros.json` en cualquier editor de texto y modifique los valores según sea necesario.

#### 2. Validación JSON
Asegúrese de que el archivo mantiene un formato JSON válido:
- Use comillas dobles para strings
- No deje comas al final del último elemento
- Mantenga la estructura de llaves y corchetes

#### 3. Ejemplo de Modificación
```json
{
  "autor": {
    "nombre": "Dr. Juan Pérez",
    "cargo": "Director de Epidemiología",
    "correo": "juan.perez@msp.gob.ec",
    "telefono": "+593-2-111222333"
  }
}
```

### 🛡️ Manejo de Errores en Parámetros

#### Sistema de Respaldo
Si el archivo `parametros.json` no existe o tiene errores:
- El sistema usa valores por defecto
- El informe se genera sin interrupciones
- Se muestran mensajes genéricos en la portada

#### Valores por Defecto
```
Autor Principal: "Autor Principal"
Co-autor: "Co-autor"
Institución: "Ministerio de Salud Pública"
Dirección: "Dirección Nacional de Vigilancia Epidemiológica"
```

## 📝 Sistema de Logs y Limpieza Automática

### 📝 Gestión de Logs

Todos los scripts de renderizado guardan logs automáticamente en el directorio `logs/`:

#### Ubicación de Logs
- **Directorio**: `logs/`
- **Formato de nombre**: `[script]_YYYYMMDD_HHMMSS.log`
- **Ejemplos**:
  - `render_simple_20251104_112352.log`
  - `renderizado_20251104_112310.log`
  - `verificacion_20251104_113000.log`

#### Scripts con Logging Automático

1. **render_simple.sh**
   - Log automático: `logs/render_simple_TIMESTAMP.log`
   - Incluye: timestamps, proceso de limpieza, inicio/fin de renderizado

2. **renderizar_informe.sh**
   - Log automático: `logs/renderizado_TIMESTAMP.log`
   - Incluye: todos los niveles de log (INFO, WARN, ERROR, DEBUG)
   - Opción `--log` para logs detallados

3. **verificar_entorno.sh**
   - Log automático: `logs/verificacion_TIMESTAMP.log`
   - Incluye: verificación de dependencias, creación de directorios

### 🧹 Limpieza Automática

En cada nueva ejecución se limpian automáticamente los archivos auxiliares del directorio `output/`:

#### Archivos que se ELIMINAN:
- ✅ Archivos `.html` antiguos
- ✅ Archivos `.docx` antiguos
- ✅ Archivos `.tex` auxiliares
- ✅ Directorios `*_files/` (recursos de HTML)
- ✅ Cualquier archivo que NO sea `.pdf`

#### Archivos que se CONSERVAN:
- ⭐ **Todos los archivos PDF** (`.pdf`)
- ⭐ Solo el directorio `_files/` del renderizado actual

### 📊 Formato de Logs

#### Estructura de Líneas de Log
```
[NIVEL] [TIMESTAMP] mensaje
```

**Ejemplo**:
```
[INFO] [2025-11-04 11:23:10] === INICIO DEL PROCESO DE RENDERIZADO ===
[INFO] [2025-11-04 11:23:10] Limpiando archivos auxiliares en directorio output
[INFO] [2025-11-04 11:23:22] ✓ Informe pdf generado exitosamente
```

#### Niveles de Log
- **INFO**: Información general del proceso
- **WARN**: Advertencias no críticas
- **ERROR**: Errores que detienen el proceso
- **DEBUG**: Información detallada (solo con `--verbose`)

### 🔍 Monitoreo y Diagnóstico de Logs

#### Ver Logs Recientes
```bash
# Listar todos los logs
ls -la logs/

# Ver último log del script simple
tail -f logs/render_simple_*.log | tail -n 20

# Ver último log del script completo
tail -f logs/renderizado_*.log | tail -n 20
```

#### Diagnosticar Problemas
```bash
# Buscar errores en logs recientes
grep -i "error" logs/*.log

# Ver warnings en logs
grep -i "warn" logs/*.log

# Ver log completo más reciente
cat logs/$(ls -t logs/ | head -n 1)
```

## 🖼️ Gestión de Imágenes y Logos

### 📋 Formatos de Imagen Soportados

#### ✅ **Completamente Soportados**

| Formato      | PDF | HTML | Word | Recomendación                                    |
| ------------ | --- | ---- | ---- | ------------------------------------------------ |
| **PNG**      | ✅   | ✅    | ✅    | **RECOMENDADO** - Mejor calidad y compatibilidad |
| **JPG/JPEG** | ✅   | ✅    | ✅    | **RECOMENDADO** - Para fotografías               |
| **PDF**      | ✅   | ⚠️    | ⚠️    | Para gráficos vectoriales en PDF                 |

#### ⚠️ **Soporte Limitado**

| Formato  | PDF | HTML | Word | Notas                                      |
| -------- | --- | ---- | ---- | ------------------------------------------ |
| **SVG**  | ⚠️   | ✅    | ⚠️    | Requiere paquete `svg` + Inkscape para PDF |
| **GIF**  | ❌   | ✅    | ✅    | No soportado en PDF                        |
| **WEBP** | ❌   | ✅    | ❌    | Solo HTML moderno                          |

### 📁 Estructura de Imágenes

```
images/
├── logos/
│   ├── escudo_ecuador.png   # Escudo nacional (portada) ✅
│   ├── logo_cabecera.jpg    # Cabecera izquierda
│   ├── logo_msp.jpg         # Cabecera derecha  
│   ├── logo_msp2.jpg        # Pie de página
│   └── logo_msp_3.png       # Logo MSP (portada) ✅
├── graficos/                # Para gráficos del análisis
├── fotos/                   # Para fotografías
└── iconos/                  # Para iconos del documento
```

### 💡 Mejores Prácticas para Imágenes

#### 1. **Nomenclatura de Archivos**
```
# ✅ CORRECTO
logo_institucion_principal.png
grafico_tendencia_temporal.png
mapa_distribución_geografica.jpg

# ❌ EVITAR
Logo Institución.png
gráfico (1).png
imagen final final v2.jpg
```

#### 2. **Tamaños Recomendados**

**Para Logos en Cabeceras:**
- **Altura:** 1.0-1.5 cm (como está configurado)
- **Resolución:** 300 DPI mínimo
- **Formato:** PNG con fondo transparente

**Para Logo en Portada:**
- **Ancho:** 40% del ancho de página (como está configurado)
- **Resolución:** 300-600 DPI
- **Formato:** PNG de alta calidad

**Para Gráficos en Contenido:**
- **Ancho:** 80-100% del ancho de página
- **Resolución:** 300 DPI para PDF, 150 DPI para HTML
- **Formato:** PNG para gráficos, JPG para fotografías

#### 3. **Inclusión en R Markdown**

**Método Recomendado (Usando knitr):**
```r
```{r nombre-imagen, echo=FALSE, out.width="40%", fig.align="center"}
knitr::include_graphics("ruta/a/imagen.png")
```
```

**Para Múltiples Imágenes Lado a Lado:**
```r
```{r logos-duales, echo=FALSE, fig.show='hold', out.width="25%", fig.align="center"}
knitr::include_graphics(c("images/logo1.png", "images/logo2.png"))
```
```

## 📊 Personalización del Informe

### Datos

1. Coloca tus datos en el directorio `data/`
2. Modifica las secciones de carga de datos en `desarrollo.Rmd`
3. Actualiza las rutas de archivos según sea necesario

### Contenido

- **Portada**: ✨ Se genera automáticamente desde `parametros.json`
- **Metodología**: Modifica `secciones/desarrollo.Rmd` para tu metodología específica
- **Análisis**: Actualiza los chunks de R con tu código de análisis
- **Conclusiones**: Personaliza `secciones/conclusiones.Rmd` con tus hallazgos

### Estilo

- **Colores**: Modifica la configuración de `ggplot2` en el chunk `setup`
- **Tipografía**: Ajusta la configuración en el YAML header
- **Logo**: Agrega tu logo institucional en `images/`

## 🎯 Ejemplos de Uso

### Desarrollo Iterativo

```bash
# Durante desarrollo, usar script simple con HTML para vista rápida  
./render_simple.sh html  # 📝 Log automático en logs/

# Para versión final, generar PDF con log completo
./renderizar_informe.sh pdf --verbose --log --clean
```

### Producción

```bash
# Generar todos los formatos para distribución
./renderizar_informe.sh todos --log --clean

# Verificar logs si hay errores
cat logs/renderizado_*.log | grep -i "error"
```

### Automatización

```bash
# Agregar a crontab para generación automática
0 8 * * 1 cd /ruta/al/proyecto && ./renderizar_informe.sh pdf --log
```

## 🐛 Solución de Problemas

### Error: "R no encontrado"

```bash
# Verificar instalación de R
which R
R --version

# En macOS, puede ser necesario agregar al PATH
export PATH="/usr/local/bin:$PATH"
```

### Error: "Pandoc no encontrado"

```bash
# Verificar pandoc
which pandoc
pandoc --version

# Instalar pandoc si es necesario
# macOS: brew install pandoc
# Ubuntu: sudo apt-get install pandoc
```

### Error en LaTeX/PDF

```r
# En R, instalar TinyTeX
install.packages("tinytex")
tinytex::install_tinytex()

# Reinstalar si hay problemas
tinytex::reinstall_tinytex()
```

### Errores de Paquetes

```r
# Verificar paquetes instalados
installed.packages()[,c("Package", "Version")]

# Actualizar todos los paquetes
update.packages()

# Instalar paquetes faltantes
install.packages("nombre_paquete")
```

### Error: "File not found" (Imágenes)
```r
# Verificar ruta relativa desde el archivo principal
file.exists("images/logos/logo_msp_3.png")
```

### Imágenes muy grandes en PDF
```r
```{r imagen-ajustada, echo=FALSE, out.width="50%", out.height="8cm"}
knitr::include_graphics("imagen_grande.png")
```
```

### Problemas con parámetros JSON

```bash
# Comprobar sintaxis JSON
python -m json.tool data/parametros.json

# Probar generación
./render_simple.sh pdf
```

## 🎯 Beneficios del Sistema

1. **Rastreabilidad**: Cada ejecución queda registrada con timestamp
2. **Diagnóstico**: Logs detallados para resolver problemas
3. **Limpieza Automática**: No acumulación de archivos auxiliares
4. **Conservación de PDFs**: Historial completo de documentos generados
5. **Gestión Eficiente**: Proceso automatizado sin intervención manual
6. **Configuración Dinámica**: Cambio fácil de autores e información institucional
7. **Soporte Completo de Imágenes**: Compatible con todos los formatos principales

## 🤝 Contribuciones

Para contribuir al proyecto:

1. Crear rama para nueva funcionalidad
2. Probar cambios con diferentes formatos
3. Documentar cambios en este README
4. Enviar pull request con descripción detallada

## 📞 Soporte

Para soporte técnico:

- **Errores de R/RMarkdown**: Verificar versiones y paquetes
- **Errores de renderizado**: Revisar logs detallados
- **Problemas de datos**: Verificar estructura y formato de archivos
- **Problemas de imágenes**: Verificar formatos y rutas de archivos
- **Problemas de parámetros**: Validar sintaxis JSON

## 📄 Licencia

Este proyecto es de uso interno del Ministerio de Salud Pública del Ecuador.

---

**Última actualización**: 4 de noviembre de 2025  
**Versión**: 1.0  
**Mantenido por**: Equipo DNVE - MSP Ecuador