import {
    Box,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Typography,
} from "@mui/material"
import React,{useEffect,useMemo,useState} from "react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

import {useCalidadDataQuality} from "../calidadDataQualityContext"

interface ProblemaCalidad {
  codigo: string
  dimension: string
  subDimension: string
  regla: string
  descripcionRegla: string
  totalRegistrosInvalidos: number
  porcentajeRegistrosInvalidos: number
}

interface ChartDataPoint {
  codigo: string
  nombre: string
  problemas: number
  porcentaje: number
  descripcion: string
}

// Colores para las barras según el nivel de problemas
const getColorForProblems = (porcentaje: number): string => {
  if (porcentaje >= 50) return "#dc2626" // Rojo oscuro - crítico
  if (porcentaje >= 30) return "#f97316" // Naranja - alto
  if (porcentaje >= 15) return "#f59e0b" // Amarillo - medio
  return "#fb923c" // Naranja claro - bajo
}

export const GraficoTop10ProblemasCalidad: React.FC = () => {
  const { data, loading } = useCalidadDataQuality()

  const [dimensionSeleccionada, setDimensionSeleccionada] = useState<string>("Todos")
  const [subDimensionSeleccionada, setSubDimensionSeleccionada] =
    useState<string>("Todos")

  // Extraer todos los problemas de calidad del contexto
  const problemasCalidad: ProblemaCalidad[] = useMemo(() => {
    if (!data || !data.dimensiones) return []

    const problemas: ProblemaCalidad[] = []

    data.dimensiones.forEach((dimension) => {
      dimension.jsonDimensionQuality.forEach((rule) => {
        if (rule.totalRegistrosInvalidos > 0) {
          problemas.push({
            codigo: rule.codigo,
            dimension: dimension.dimension,
            subDimension: rule.subDimension,
            regla: rule.regla,
            descripcionRegla: rule.descripcionRegla,
            totalRegistrosInvalidos: rule.totalRegistrosInvalidos,
            porcentajeRegistrosInvalidos: rule.porcentajeRegistrosInvalidos,
          })
        }
      })
    })

    return problemas
  }, [data])

  // Extraer dimensiones únicas
  const dimensionesUnicas = useMemo(() => {
    const dims = new Set(problemasCalidad.map((p) => p.dimension))
    return Array.from(dims).sort()
  }, [problemasCalidad])

  // Extraer subdimensiones únicas basadas en la dimensión seleccionada
  const subDimensionesUnicas = useMemo(() => {
    if (!dimensionSeleccionada || dimensionSeleccionada === "Todos") return []
    const subDims = new Set(
      problemasCalidad
        .filter((p) => p.dimension === dimensionSeleccionada)
        .map((p) => p.subDimension)
    )
    return Array.from(subDims).sort()
  }, [problemasCalidad, dimensionSeleccionada])

  // Inicializar subdimensión por defecto cuando cambia la dimensión
  useEffect(() => {
    if (dimensionSeleccionada === "Todos") {
      setSubDimensionSeleccionada("Todos")
    } else if (subDimensionesUnicas.length > 0 && subDimensionSeleccionada === "Todos") {
      setSubDimensionSeleccionada(subDimensionesUnicas[0])
    } else if (
      subDimensionSeleccionada &&
      subDimensionSeleccionada !== "Todos" &&
      !subDimensionesUnicas.includes(subDimensionSeleccionada)
    ) {
      setSubDimensionSeleccionada(
        subDimensionesUnicas.length > 0 ? subDimensionesUnicas[0] : "Todos"
      )
    }
  }, [dimensionSeleccionada, subDimensionesUnicas, subDimensionSeleccionada])

  // Filtrar y preparar datos para el gráfico
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!dimensionSeleccionada || !subDimensionSeleccionada) return []

    let problemasFiltrados = problemasCalidad

    // Filtrar por dimensión si no es "Todos"
    if (dimensionSeleccionada !== "Todos") {
      problemasFiltrados = problemasFiltrados.filter(
        (p) => p.dimension === dimensionSeleccionada
      )
    }

    // Filtrar por subdimensión si no es "Todos"
    if (subDimensionSeleccionada !== "Todos") {
      problemasFiltrados = problemasFiltrados.filter(
        (p) => p.subDimension === subDimensionSeleccionada
      )
    }

    problemasFiltrados = problemasFiltrados
      .sort((a, b) => b.totalRegistrosInvalidos - a.totalRegistrosInvalidos)
      .slice(0, 10) // Top 10

    return problemasFiltrados.map((p) => ({
      codigo: p.codigo,
      nombre: p.regla.length > 30 ? p.regla.substring(0, 30) + "..." : p.regla,
      problemas: p.totalRegistrosInvalidos,
      porcentaje: p.porcentajeRegistrosInvalidos,
      descripcion: p.descripcionRegla,
    }))
  }, [problemasCalidad, dimensionSeleccionada, subDimensionSeleccionada])

  const handleDimensionChange = (event: SelectChangeEvent<string>) => {
    setDimensionSeleccionada(event.target.value)
  }

  const handleSubDimensionChange = (event: SelectChangeEvent<string>) => {
    setSubDimensionSeleccionada(event.target.value)
  }

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <Card
          sx={{
            p: 1.5,
            boxShadow: 3,
            maxWidth: 350,
          }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {data.codigo}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {data.descripcion}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2">
              <strong>Problemas:</strong>{" "}
              {new Intl.NumberFormat("es-ES").format(data.problemas)}
            </Typography>
            <Typography variant="body2">
              <strong>Porcentaje:</strong> {data.porcentaje.toFixed(2)}%
            </Typography>
          </Box>
        </Card>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Cargando datos de calidad...</Typography>
        </CardContent>
      </Card>
    )
  }

  if (problemasCalidad.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top 10 Problemas de Calidad
          </Typography>
          <Typography color="text.secondary">
            No hay problemas de calidad registrados
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Top 10 Problemas de Calidad
        </Typography>

        {/* Filtros de Dimensión y SubDimensión */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            flexWrap: "wrap",
          }}>
          <FormControl sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel id="dimension-select-label">Dimensión</InputLabel>
            <Select
              labelId="dimension-select-label"
              id="dimension-select"
              value={dimensionSeleccionada}
              label="Dimensión"
              onChange={handleDimensionChange}>
              <MenuItem value="Todos">
                Todos
              </MenuItem>
              {dimensionesUnicas.map((dim) => (
                <MenuItem key={dim} value={dim}>
                  {dim}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel id="subdimension-select-label">
              SubDimensión
            </InputLabel>
            <Select
              labelId="subdimension-select-label"
              id="subdimension-select"
              value={subDimensionSeleccionada}
              label="SubDimensión"
              onChange={handleSubDimensionChange}
              disabled={dimensionSeleccionada === "Todos" || subDimensionesUnicas.length === 0}>
              {subDimensionesUnicas.map((subDim) => (
                <MenuItem key={subDim} value={subDim}>
                  {subDim}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Gráfico */}
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="nombre"
                type="category"
                width={150}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                payload={[
                  {
                    value: "Cantidad de registros con problemas",
                    type: "square",
                    color: "#f97316",
                  },
                ]}
              />
              <Bar dataKey="problemas" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getColorForProblems(entry.porcentaje)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 200,
            }}>
            <Typography color="text.secondary">
              No hay problemas registrados para esta combinación de dimensión y
              subdimensión
            </Typography>
          </Box>
        )}

        {/* Información adicional */}
        {chartData.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Mostrando {chartData.length} problema(s) de calidad
              {dimensionSeleccionada === "Todos" 
                ? " para todas las dimensiones"
                : subDimensionSeleccionada === "Todos"
                  ? ` para ${dimensionSeleccionada}`
                  : ` para ${dimensionSeleccionada} → ${subDimensionSeleccionada}`}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
