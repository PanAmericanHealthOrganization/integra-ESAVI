# Componente TablaProblemasCalidad

## Descripción

Componente React para visualizar y gestionar problemas de calidad de datos del sistema INTEGRA-ESAVI. Permite filtrar por dimensiones y subdimensiones, visualizar métricas de calidad mediante barras de progreso, y descargar reportes de errores en formato CSV.

## Características Principales

✅ **Filtrado por Dimensión**: Muestra solo los problemas de una dimensión específica
✅ **Filtros con Chips**: Permite seleccionar subdimensiones mediante chips interactivos
✅ **Visualización Clara**: Código y regla en una celda, con la regla destacada
✅ **Tooltips Informativos**: Muestra condiciones al pasar el mouse sobre las descripciones
✅ **Barras de Progreso**: Visualización de porcentajes válidos (verde) vs errores (rojo)
✅ **Descarga CSV**: Botón de descarga habilitado solo cuando hay errores disponibles
✅ **TypeScript**: Completamente tipado para mejor autocompletado y seguridad

## Estructura de Archivos

```
src/pages/calidad/
├── components/
│   ├── TablaProblemasCalidad.tsx      # Componente principal
│   ├── QualityProblemsTable.tsx       # Componente anterior (mantener compatibilidad)
│   ├── EjemploTablaProblemasCalidad.tsx  # Ejemplo de uso
│   └── index.ts                       # Exportaciones
├── types/
│   ├── calidad.types.ts               # Interfaces TypeScript
│   └── index.ts                       # Exportaciones
└── utils/
    └── estructuraCalidad.ts           # Estructura de dimensiones y subdimensiones
```

## Interfaces TypeScript

### ProblemaCalidad
```typescript
interface ProblemaCalidad {
  codigo: string                        // Código del problema (ej: "EXA_SEM_001")
  subDimension: string                  // Subdimensión (ej: "Dimensión de Exactitud Semántica")
  regla: string                         // Nombre de la regla
  condicion?: string                    // Condición de validación (opcional)
  descripcionRegla: string              // Descripción detallada
  totalRegistros: number                // Total de registros evaluados
  totalRegistrosValidos: number         // Registros válidos
  totalRegistrosInvalidos: number       // Registros con errores
  porcentajeRegistrosValidos: number    // % de válidos
  porcentajeRegistrosInvalidos: number  // % de errores
  idNotificacionesNoValidos: string[]   // IDs de registros con error
}
```

### DimensionCalidad
```typescript
interface DimensionCalidad {
  dimension: string                     // Nombre de la dimensión
  calidadTotal: number                  // Porcentaje de calidad total
  deltaCalidadTotal: number             // Variación respecto al período anterior
  jsonDimensionQuality: ProblemaCalidad[]  // Lista de problemas
}
```

## API - Data Provider

### getDataQualitySummary
Obtiene el resumen general de calidad de datos.

```typescript
await calidadDataProvider.getDataQualitySummary(
  "dataquality",
  {
    filter: { date: "2025-01-01" },
    pagination: { page: 1, perPage: 10 },
    sort: { field: "id", order: "ASC" },
  }
)
```

**Endpoint**: `GET /dataquality/general?date=2025-01-01`

**Respuesta**: Objeto con estructura `DataQualityResponse` que contiene array `jsonQuality` con todas las dimensiones.

### getProblems
Obtiene el detalle de problemas específicos por código.

```typescript
await calidadDataProvider.getProblems(
  "dataquality",
  2024,  // año
  12,    // mes
  "CON_DOM_004"  // código del problema
)
```

**Endpoint**: `GET /dataquality/problems?anio=2024&mes=12&codigo=CON_DOM_004`

**Respuesta**: Array de objetos `ProblemaDetalle[]`

### downloadProblemsCSV
Descarga un archivo CSV con el detalle de problemas.

```typescript
await calidadDataProvider.downloadProblemsCSV(
  "dataquality",
  2024,
  12,
  "CON_DOM_004"
)
```

Genera y descarga automáticamente el archivo: `problemas_calidad_CON_DOM_004_2024_12.csv`

## Uso del Componente

### Importación
```typescript
import { TablaProblemasCalidad } from "@/pages/calidad/components"
import { DimensionCalidad } from "@/pages/calidad/types"
import { calidadDataProvider } from "@/dataProviders/calidad.dataprovider"
```

### Props del Componente

| Prop         | Tipo                          | Requerido | Descripción                      |
| ------------ | ----------------------------- | --------- | -------------------------------- |
| `dimension`  | `string`                      | Sí        | Nombre de la dimensión a mostrar |
| `data`       | `DimensionCalidad \| null`    | Sí        | Datos de la dimensión            |
| `onDownload` | `(codigo, anio, mes) => void` | No        | Callback para descarga           |
| `anio`       | `number`                      | No        | Año del período                  |
| `mes`        | `number`                      | No        | Mes del período                  |

### Ejemplo Básico

```typescript
import React from "react"
import { TablaProblemasCalidad } from "./components/TablaProblemasCalidad"
import { calidadDataProvider } from "@/dataProviders/calidad.dataprovider"

export const CalidadPage = () => {
  const [data, setData] = React.useState(null)
  
  React.useEffect(() => {
    const fetchData = async () => {
      const response = await calidadDataProvider.getDataQualitySummary(
        "dataquality",
        { filter: { date: "2025-01-01" } }
      )
      
      // Filtrar la dimensión específica
      const dimension = response.jsonQuality?.find(
        d => d.dimension === "Dimensión de Exactitud"
      )
      
      setData(dimension)
    }
    
    fetchData()
  }, [])

  const handleDownload = async (codigo, anio, mes) => {
    await calidadDataProvider.downloadProblemsCSV(
      "dataquality",
      anio,
      mes,
      codigo
    )
  }

  return (
    <TablaProblemasCalidad
      dimension="Dimensión de Exactitud"
      data={data}
      onDownload={handleDownload}
      anio={2024}
      mes={12}
    />
  )
}
```

### Ejemplo con Pestañas (Tabs)

```typescript
import React from "react"
import { Box, Tabs, Tab } from "@mui/material"
import { TablaProblemasCalidad } from "./components/TablaProblemasCalidad"

const dimensiones = [
  "Dimensión de Exactitud",
  "Dimensión de Consistencia",
  "Dimensión de Completitud",
]

export const CalidadConTabs = () => {
  const [tabValue, setTabValue] = React.useState(0)
  const [dataCompleta, setDataCompleta] = React.useState(null)

  // Obtener la dimensión actual basada en el tab seleccionado
  const dimensionActual = dataCompleta?.jsonQuality?.find(
    d => d.dimension === dimensiones[tabValue]
  )

  return (
    <Box>
      <Tabs 
        value={tabValue} 
        onChange={(e, newValue) => setTabValue(newValue)}
      >
        {dimensiones.map((dim, index) => (
          <Tab key={index} label={dim} />
        ))}
      </Tabs>

      <TablaProblemasCalidad
        dimension={dimensiones[tabValue]}
        data={dimensionActual}
        onDownload={handleDownload}
        anio={2024}
        mes={12}
      />
    </Box>
  )
}
```

## Funcionalidades de la UI

### 1. Chips de Subdimensiones
- Se muestran automáticamente basados en los datos
- Click en "Todas" para ver todos los problemas
- Click en una subdimensión específica para filtrar

### 2. Tabla de Problemas

**Columnas:**
- **Código / Regla**: Código en texto pequeño, regla destacada en negrita
- **Descripción de Regla**: Con tooltip que muestra la condición al pasar el mouse
- **Tot. Registros**: Total de registros evaluados, formateado con separadores de miles
- **Válidos vs Errores**: Barra horizontal con porcentajes en verde (válidos) y rojo (errores)
- **Descarga**: Botón de descarga (solo visible si hay errores)

### 3. Barra de Progreso

```
[████████████░░░] 85.5% / 14.5%
  Verde (válidos)   Rojo (errores)
```

### 4. Botón de Descarga
- Solo se muestra si `idNotificacionesNoValidos.length > 0`
- Icono de descarga con tooltip
- Al hacer click, descarga CSV con el detalle de errores

## Dimensiones Disponibles

Según `estructuraCalidad.ts`, las dimensiones son:

1. **Dimensión de Exactitud**
   - Subdimensión de Exactitud Semántica

2. **Dimensión de Consistencia**
   - Subdimensión de Consistencia de Dominio
   - Subdimensión de Consistencia de Formato
   - Subdimensión de Consistencia de Interrelación

3. *Otras dimensiones según configuración*

## Personalización

### Cambiar colores de la barra
```typescript
<LinearProgress
  sx={{
    backgroundColor: "#tu-color-rojo",  // Fondo (errores)
    "& .MuiLinearProgress-bar": {
      backgroundColor: "#tu-color-verde",  // Barra (válidos)
    },
  }}
/>
```

### Cambiar formato de números
```typescript
const numberFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})
```

## Manejo de Errores

### Sin datos
El componente muestra un mensaje cuando:
- `data` es `null`
- La dimensión no coincide
- No hay problemas para mostrar

### Descarga fallida
Si falla la descarga, se muestra un alert con el mensaje de error.

## Testing

### Casos de prueba recomendados

1. ✅ Renderiza correctamente con datos válidos
2. ✅ Muestra mensaje cuando no hay datos
3. ✅ Filtra correctamente por subdimensión
4. ✅ Muestra/oculta botón de descarga según haya errores
5. ✅ Llama a `onDownload` con parámetros correctos
6. ✅ Formatea números correctamente
7. ✅ Calcula porcentajes correctamente en la barra

## Dependencias

- React 18+
- Material-UI (MUI) v5+
- TypeScript 4.5+
- react-admin (para el data provider)
- axios (para llamadas HTTP)

## Notas Técnicas

1. **Filtrado por Dimensión**: El componente espera recibir solo la data de UNA dimensión específica. El filtrado se hace antes de pasar la prop `data`.

2. **Subdimensiones Dinámicas**: Los chips se generan automáticamente basados en los valores únicos de `subDimension` en los datos.

3. **CSV**: La descarga CSV maneja correctamente valores con comas y comillas, escapándolos según el estándar RFC 4180.

4. **Performance**: El componente usa `useMemo` para optimizar el filtrado y agrupación de datos.

## Migración desde QualityProblemsTable

Si estás usando el componente anterior `QualityProblemsTable`, los cambios principales son:

1. **Nombre**: `QualityProblemsTable` → `TablaProblemasCalidad`
2. **Props**: Ahora incluye `anio`, `mes` y `onDownload`
3. **Filtrado**: Ahora se hace ANTES de pasar al componente
4. **Tipos**: Importar desde `../types/calidad.types`

## Soporte

Para problemas o preguntas, contactar al equipo de desarrollo de INTEGRA-ESAVI.

---

**Última actualización**: Diciembre 2025
**Versión**: 1.0.0
