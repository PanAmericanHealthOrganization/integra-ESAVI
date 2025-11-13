import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material"
import { useEffect, useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useCalidadDataQuality } from "../calidadDataQualityContext"

const numberFormatter = new Intl.NumberFormat("es-ES")

const getStatusColor = (percentage: number) => {
  if (percentage >= 95) return "success"
  if (percentage >= 75) return "warning"
  return "error"
}

const getStatusLabel = (percentage: number) => {
  if (percentage >= 95) return "Óptimo"
  if (percentage >= 75) return "Aceptable"
  return "Crítico"
}

const LoadingState = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: 400,
    }}>
    <Typography variant="h6">Cargando datos de completitud…</Typography>
  </Box>
)

const EmptyState = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: 400,
    }}>
    <Typography variant="h6">
      No hay información de completitud disponible para la fecha seleccionada.
    </Typography>
  </Box>
)

const CalidadCompletitud: React.FC = () => {
  const { data, loading, refresh } = useCalidadDataQuality()
  const [selectedTable, setSelectedTable] = useState<string>("")

  const tablasDisponibles = useMemo(() => {
    if (!data) return []
    return Array.from(
      new Set(data.completenessQualityTable.map((row) => row.tableName))
    ).sort()
  }, [data])

  useEffect(() => {
    if (!selectedTable && tablasDisponibles.length > 0) {
      setSelectedTable(tablasDisponibles[0])
    }
  }, [selectedTable, tablasDisponibles])

  const columnasTabla = useMemo(() => {
    if (!data || !selectedTable) return []
    return data.completenessQualityTable.filter(
      (row) => row.tableName === selectedTable
    )
  }, [data, selectedTable])

  const resumenTabla = useMemo(() => {
    if (columnasTabla.length === 0) return null

    const totalColumnas = columnasTabla.length
    const promedio =
      columnasTabla.reduce(
        (acc, item) => acc + item.completenessPercentage,
        0
      ) / totalColumnas

    const totalRegistros = columnasTabla.reduce(
      (acc, item) => acc + item.totalRecords,
      0
    )

    const totalNulls = columnasTabla.reduce(
      (acc, item) => acc + item.totalNulls,
      0
    )

    const totalNonNulls = columnasTabla.reduce(
      (acc, item) => acc + item.totalNonNulls,
      0
    )

    const columnasCriticas = columnasTabla.filter(
      (item) => item.completenessPercentage < 50
    ).length

    return {
      totalColumnas,
      promedio,
      totalRegistros,
      totalNulls,
      totalNonNulls,
      columnasCriticas,
    }
  }, [columnasTabla])

  const chartData = useMemo(
    () =>
      columnasTabla.map((column) => ({
        columna: column.columnName,
        completitud: Number(column.completenessPercentage.toFixed(2)),
        nulos: column.totalNulls,
        noNulos: column.totalNonNulls,
      })),
    [columnasTabla]
  )

  if (loading) {
    return <LoadingState />
  }

  if (!data) {
    return <EmptyState />
  }

  const promedioTabla = resumenTabla?.promedio ?? 0
  const columnasCriticas = resumenTabla?.columnasCriticas ?? 0
  const totalNonNulls = resumenTabla?.totalNonNulls ?? 0
  const totalColumnas = resumenTabla?.totalColumnas ?? 0

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Completitud de datos por tabla
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Tabla</InputLabel>
            <Select
              label="Tabla"
              value={selectedTable}
              onChange={(event) => setSelectedTable(event.target.value)}>
              {tablasDisponibles.map((table) => (
                <MenuItem key={table} value={table}>
                  {table}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={refresh}>
            Actualizar
          </Button>
        </Stack>
      </Stack>

      {columnasTabla.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Columnas evaluadas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                    {numberFormatter.format(totalColumnas)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Promedio de completitud
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                    {promedioTabla.toFixed(2)}%
                  </Typography>
                  <Chip
                    label={getStatusLabel(promedioTabla)}
                    color={getStatusColor(promedioTabla) as any}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Registros con datos
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                    {numberFormatter.format(totalNonNulls)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sin valores nulos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Columnas críticas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                    {numberFormatter.format(columnasCriticas)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Menos de 50% de completitud
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Completitud por columna
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis type="category" dataKey="columna" width={240} />
                        <Tooltip formatter={(value) => [`${value}%`, "Completitud"]} />
                        <Bar
                          dataKey="completitud"
                          fill="#3b82f6"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Detalle de columnas
                  </Typography>
                  <Stack spacing={2} sx={{ maxHeight: 380, overflowY: "auto" }}>
                    {columnasTabla
                      .slice()
                      .sort(
                        (a, b) =>
                          a.completenessPercentage - b.completenessPercentage
                      )
                      .map((column) => (
                        <Box key={column.columnName}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontFamily: "monospace" }}>
                            {column.columnName}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom>
                            {column.columnDescription}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center">
                            <Chip
                              label={`${column.completenessPercentage.toFixed(2)}%`}
                              color={
                                getStatusColor(column.completenessPercentage) as any
                              }
                              size="small"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {numberFormatter.format(column.totalNonNulls)} /
                              {` ${numberFormatter.format(column.totalRecords)} registros`}
                            </Typography>
                          </Stack>
                        </Box>
                      ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}

export default CalidadCompletitud
