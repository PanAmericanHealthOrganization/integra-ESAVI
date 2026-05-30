import { Box, Card, CardContent, Typography } from "@mui/material"
import { useDataProvider, useNotify } from "ra-core"
import React, { useEffect, useState } from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ICalidadDataProvider } from "../../../dataProviders/calidad.dataprovider"
import { useCalidadDataQuality } from "../calidadDataQualityContext"

interface HistoryDataPoint {
  anio: number
  mes: number
  sumaryDataQuality: Array<{
    dimension: string
    calidadTotal: number
  }>
}

interface ChartDataPoint {
  periodo: string
  [key: string]: number | string // Para las dimensiones dinámicas
}

// Colores para las diferentes dimensiones
const DIMENSION_COLORS: { [key: string]: string } = {
  Completitud: "#16a34a", // Verde
  Exactitud: "#2563eb", // Azul
  Consistencia: "#f59e0b", // Naranja
  Vigencia: "#8b5cf6", // Púrpura
  Unicidad: "#ec4899", // Rosa
}

export const GraficoHistoricoCalidad: React.FC = () => {
  const { selectedDate } = useCalidadDataQuality()
  const dataProvider = useDataProvider<ICalidadDataProvider>()
  const notify = useNotify()

  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [dimensions, setDimensions] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const fetchHistoryData = async () => {
      if (!selectedDate) return

      setLoading(true)
      try {
        // Extraer el año de selectedDate (formato: YYYY-MM)
        const year = selectedDate.split("-")[0]
        const endDay = `${selectedDate}-01` // Primer día del mes seleccionado

        // Calcular el startDay como enero del año seleccionado
        const startDay = `${year}-01-01`

        const response = await dataProvider.getHistory(
          "dataquality",
          startDay,
          endDay
        )

        console.log("Respuesta del servicio /history:", response)

        if (!response || response.length === 0) {
          setChartData([])
          setDimensions([])
          return
        }

        // Procesar los datos para el gráfico
        const processedData = processHistoryData(response)
        console.log("Datos procesados para el gráfico:", processedData)
        setChartData(processedData.data)
        setDimensions(processedData.dimensions)
      } catch (error) {
        console.error("Error al obtener datos históricos:", error)
        notify("Error al cargar datos históricos de calidad", { type: "error" })
        setChartData([])
        setDimensions([])
      } finally {
        setLoading(false)
      }
    }

    fetchHistoryData()
  }, [selectedDate, dataProvider, notify])

  const processHistoryData = (
    historyData: HistoryDataPoint[]
  ): { data: ChartDataPoint[]; dimensions: string[] } => {
    const dimensionsSet = new Set<string>()
    const dataMap = new Map<string, ChartDataPoint>()

    historyData.forEach((item) => {
      // Formato de periodo: "YYYY-MM" desde anio y mes
      const periodo = `${item.anio}-${String(item.mes).padStart(2, "0")}`

      if (!dataMap.has(periodo)) {
        dataMap.set(periodo, { periodo })
      }

      const dataPoint = dataMap.get(periodo)!

      item.sumaryDataQuality.forEach((dimData) => {
        const dimensionName = dimData.dimension
        dimensionsSet.add(dimensionName)
        dataPoint[dimensionName] = dimData.calidadTotal
      })
    })

    // Ordenar por periodo
    const sortedData = Array.from(dataMap.values()).sort((a, b) =>
      a.periodo.localeCompare(b.periodo)
    )

    return {
      data: sortedData,
      dimensions: Array.from(dimensionsSet),
    }
  }

  const formatPeriodo = (periodo: string) => {
    const [year, month] = periodo.split("-")
    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ]
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Histórico de Calidad
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 400,
            }}>
            <Typography variant="body1" color="text.secondary">
              Cargando datos históricos...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Histórico de Calidad
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 400,
            }}>
            <Typography variant="body1" color="text.secondary">
              No hay datos históricos disponibles para el período seleccionado.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Histórico de Calidad por Dimensión
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Evolución de la calidad desde enero hasta{" "}
          {formatPeriodo(selectedDate)}
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="periodo"
              tickFormatter={formatPeriodo}
              style={{ fontSize: "12px" }}
            />
            <YAxis
              domain={[0, 100]}
              label={{
                value: "Calidad (%)",
                angle: -90,
                position: "insideLeft",
              }}
              style={{ fontSize: "12px" }}
            />
            <Tooltip
              labelFormatter={formatPeriodo}
              formatter={(value: number) => `${value.toFixed(2)}%`}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {dimensions.map((dimension) => (
              <Line
                key={dimension}
                type="monotone"
                dataKey={dimension}
                stroke={DIMENSION_COLORS[dimension] || "#6b7280"}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={dimension}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
