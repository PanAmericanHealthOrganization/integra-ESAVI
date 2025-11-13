import { Box, Card, CardContent, Grid, Typography } from "@mui/material"
import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useCalidadDataQuality } from "../calidadDataQualityContext"

const numberFormatter = new Intl.NumberFormat("es-ES")

const completenessBuckets = [
  { id: "full", label: "100% completitud", color: "#16a34a", match: (v: number) => v === 100 },
  { id: "high", label: "75% - 99%", color: "#22c55e", match: (v: number) => v >= 75 && v < 100 },
  { id: "medium", label: "50% - 74%", color: "#f97316", match: (v: number) => v >= 50 && v < 75 },
  { id: "low", label: "1% - 49%", color: "#ef4444", match: (v: number) => v > 0 && v < 50 },
  { id: "empty", label: "0%", color: "#991b1b", match: (v: number) => v === 0 },
]

const LoadingState = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: 300,
    }}>
    <Typography variant="h6">Cargando resumen general…</Typography>
  </Box>
)

const EmptyState = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: 300,
    }}>
    <Typography variant="h6">
      No hay datos de calidad disponibles para la fecha seleccionada.
    </Typography>
  </Box>
)

type ChartEmptyStateProps = { message: string }

const ChartEmptyState = ({ message }: ChartEmptyStateProps) => (
  <Box
    sx={{
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      px: 2,
      textAlign: "center",
    }}>
    <Typography variant="body1" color="text.secondary">
      {message}
    </Typography>
  </Box>
)

export const CalidadGeneral: React.FC = () => {
  const { data, loading } = useCalidadDataQuality()

  const resumen = useMemo(() => {
    if (!data) return null

    const totalCampos = data.completenessQualityTable.length

    const promedioCompletitud =
      totalCampos > 0
        ? data.completenessQualityTable.reduce(
            (acc, item) => acc + item.completenessPercentage,
            0
          ) / totalCampos
        : 0

    const camposCompletos = data.completenessQualityTable.filter(
      (item) => item.completenessPercentage === 100
    ).length

    const camposCriticos = data.completenessQualityTable.filter(
      (item) => item.completenessPercentage < 50
    ).length

    return {
      totalRegistros: data.totalRegistros,
      totalErrores: data.totalErrores,
      promedioCompletitud,
      totalCampos,
      camposCompletos,
      camposCriticos,
    }
  }, [data])

  const topCamposIncompletos = useMemo(() => {
    if (!data) return []

    return [...data.completenessQualityTable]
      .sort(
        (a, b) =>
          a.completenessPercentage - b.completenessPercentage ||
          b.totalRecords - a.totalRecords
      )
      .slice(0, 10)
      .map((item) => ({
        nombre: `${item.tableName}.${item.columnName}`,
        completitud: Number(item.completenessPercentage.toFixed(2)),
        faltante: Number((100 - item.completenessPercentage).toFixed(2)),
      }))
  }, [data])

  const distribucionCompletitud = useMemo(() => {
    if (!data)
      return completenessBuckets.map((bucket) => ({ ...bucket, count: 0 }))

    return completenessBuckets
      .map((bucket) => ({
        ...bucket,
        count: data.completenessQualityTable.filter((row) =>
          bucket.match(row.completenessPercentage)
        ).length,
      }))
      .filter((bucket) => bucket.count > 0)
  }, [data])

  const columnasConMasNulos = useMemo(() => {
    if (!data) return []

    return data.completenessQualityTable
      .filter((row) => row.totalNulls > 0)
      .sort((a, b) => b.totalNulls - a.totalNulls)
      .slice(0, 8)
      .map((row) => ({
        columna: `${row.tableName}.${row.columnName}`,
        nulos: row.totalNulls,
        noNulos: row.totalNonNulls,
      }))
  }, [data])

  if (loading) {
    return <LoadingState />
  }

  if (!data || !resumen) {
    return <EmptyState />
  }

  return (
    <Box sx={{ p: 3, bgcolor: "grey.50" }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Registros evaluados
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                {numberFormatter.format(resumen.totalRegistros)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Registros considerados en la evaluación
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Errores detectados
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                {numberFormatter.format(resumen.totalErrores)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Registros con problemas de calidad
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Promedio de completitud
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                {resumen.promedioCompletitud.toFixed(2)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Promedio global de campos completos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Columnas críticas
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                {numberFormatter.format(resumen.camposCriticos)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Columnas con menos de 50% de completitud
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Top 10 columnas con menor completitud
              </Typography>
              <Box sx={{ height: 320 }}>
                {topCamposIncompletos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCamposIncompletos} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis type="category" dataKey="nombre" width={240} />
                      <Tooltip formatter={(value) => [`${value}%`, "Completitud"]} />
                      <Legend />
                      <Bar
                        dataKey="completitud"
                        name="Completitud"
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar
                        dataKey="faltante"
                        name="Dato faltante"
                        fill="#ef4444"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmptyState message="Todas las columnas presentan 100% de completitud." />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Distribución de completitud
              </Typography>
              <Box sx={{ height: 280 }}>
                {distribucionCompletitud.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribucionCompletitud}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ label, count }) => `${label}: ${count}`}>
                        {distribucionCompletitud.map((entry) => (
                          <Cell key={entry.id} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmptyState message="No se registraron columnas evaluadas para calcular la distribución." />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Columnas con mayor número de valores nulos
              </Typography>
              <Box sx={{ height: 360 }}>
                {columnasConMasNulos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={columnasConMasNulos} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="columna" width={260} />
                      <Tooltip
                        formatter={(value) => [
                          numberFormatter.format(value as number),
                          "",
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="nulos"
                        name="Valores nulos"
                        fill="#ef4444"
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar
                        dataKey="noNulos"
                        name="Valores completos"
                        fill="#10b981"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmptyState message="No se encontraron columnas con valores nulos para la fecha seleccionada." />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
