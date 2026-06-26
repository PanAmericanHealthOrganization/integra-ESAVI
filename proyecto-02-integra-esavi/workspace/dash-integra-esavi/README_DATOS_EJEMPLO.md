# Generador de Datos de Ejemplo ESAVI - Ecuador

Este conjunto de scripts genera datos de ejemplo para el sistema de vigilancia de Eventos Supuestamente Atribuibles a Vacunación o Inmunización (ESAVI) específicamente para Ecuador con vacunas COVID-19.

## 📋 Descripción

El sistema genera **300 registros de ejemplo** que incluyen:
- Datos de pacientes ecuatorianos
- Reportes de ESAVI con fechas del período COVID (2021-2024)
- Información de vacunas COVID-19 disponibles en Ecuador
- Eventos adversos basados en códigos MedDRA
- Datos de embarazos, seriedad y desenlaces
- Información geográfica de las 24 provincias de Ecuador

## 🚀 Uso Rápido

### Opción 1: Ejecución Automática Completa
```r
source("ejecutar_ejemplo_completo.R")
```
Este script ejecuta todo el proceso automáticamente:
1. Genera los datos de ejemplo
2. Los procesa con el script de procesamiento
3. Verifica que todo se haya creado correctamente
4. Muestra un resumen de los datos

### Opción 2: Ejecución Manual Paso a Paso
```r
# 1. Generar datos de ejemplo
source("generar_datos_ejemplo.R")

# 2. Procesar los datos (desde el directorio scripts)
setwd("scripts")
source("procesamiento_datos.R")
setwd("..")
```

## 📁 Estructura de Archivos Generados

### Datos Fuente (directorio `Fuentes de datos/`)
- `db_reg_patient.rds` - Información de pacientes
- `db_reg_report.rds` - Reportes de ESAVI
- `db_reg_vaccine.rds` - Información de vacunas
- `db_reg_event.rds` - Eventos adversos
- `db_reg_pregnancy.rds` - Datos de embarazos
- `db_reg_seriousness_outcome.rds` - Seriedad y desenlaces
- `dosis_administradas.rds` - Dosis administradas por semana
- `sem_epi.rds` - Semanas epidemiológicas
- `meddra.rds` - Códigos y jerarquía MedDRA

### Datos Procesados (directorio `datos/`)
- `datos_procesados.rds` - Datos finales listos para el dashboard
- `dosis_admin.rds` - Dosis procesadas
- `geo_datos.rds` - Información geográfica de Ecuador

## 🇪🇨 Características Específicas de Ecuador

### Geografía
- **24 provincias**: Azuay, Bolívar, Cañar, Carchi, Chimborazo, Cotopaxi, El Oro, Esmeraldas, Galápagos, Guayas, Imbabura, Loja, Los Ríos, Manabí, Morona Santiago, Napo, Orellana, Pastaza, Pichincha, Santa Elena, Santo Domingo de los Tsáchilas, Sucumbíos, Tungurahua, Zamora Chinchipe
- **Código ISO**: ECU

### Vacunas COVID-19
- **Pfizer-BioNTech**
- **AstraZeneca**
- **Sinovac**
- **Moderna**
- **Johnson & Johnson**
- **CanSino**

### Eventos Adversos (MedDRA)
- Fatiga
- Dolor de cabeza
- Fiebre
- Mareos
- Diarrea
- Bradicardia
- Anafilaxis
- Convulsiones
- Miocarditis
- Vómitos

## 📊 Características de los Datos

### Distribución Demográfica
- **Sexo**: ~48% Masculino, ~52% Femenino
- **Edades**: Desde recién nacidos hasta adultos mayores
- **Grupos etarios**: <18, 18-24, 25-49, 50-59, 60-69, 70-79, >80 años

### Período Temporal
- **Vacunaciones**: 2021-2024
- **Notificaciones**: 2021-2024
- **Eventos**: Ocurren entre 0-30 días post-vacunación

### Gravedad y Desenlaces
- **85% No graves**, 15% Graves
- **98% Sobreviven**, 2% Muertes
- Desenlaces: Recuperado completamente, En recuperación, No recuperado, Con secuelas, Muerte

## 🔧 Requisitos

### Librerías R Necesarias
```r
library(data.table)
library(dplyr)
library(lubridate)
```

### Estructura de Directorios
El script creará automáticamente:
- `Fuentes de datos/` - Para archivos fuente
- `datos/` - Para archivos procesados

## ⚙️ Configuración

### Modificar Número de Registros
En `generar_datos_ejemplo.R`, línea 19:
```r
n_registros <- 300  # Cambiar por el número deseado
```

### Modificar Período de Fechas
En `generar_datos_ejemplo.R`, líneas 65-66:
```r
fechas_notificacion <- sample(seq(as.Date("2021-01-01"), as.Date("2025-12-31"), by = "day"), 
                             n_registros, replace = TRUE)
```

### Semilla de Aleatoriedad
Para resultados reproducibles, línea 18:
```r
set.seed(123)  # Cambiar por otro número para datos diferentes
```

## 🎯 Casos de Uso

1. **Desarrollo y Pruebas**: Datos realistas para desarrollo del dashboard
2. **Capacitación**: Datos seguros para entrenar personal
3. **Demostración**: Mostrar funcionalidades del sistema
4. **Validación**: Probar algoritmos y visualizaciones

## ⚠️ Notas Importantes

- Los datos son **completamente ficticios** y generados aleatoriamente
- **No representan datos reales** de salud pública de Ecuador
- Solo para uso en **desarrollo, pruebas y capacitación**
- Los códigos MedDRA son ejemplos simplificados

## 🔍 Verificación de Datos

Después de la ejecución, verifica:
1. Que se crearon todos los archivos RDS
2. Que los datos procesados tienen la estructura correcta
3. Que las fechas están en rangos lógicos
4. Que la distribución demográfica es realista

## 📞 Soporte

Para problemas o modificaciones:
1. Verificar que todas las librerías estén instaladas
2. Comprobar permisos de escritura en los directorios
3. Revisar mensajes de error en la consola
4. Validar que la estructura de directorios sea correcta

---

**Versión**: 1.0  
**Fecha**: 2025  
**Propósito**: Generación de datos de ejemplo para sistema ESAVI Ecuador
