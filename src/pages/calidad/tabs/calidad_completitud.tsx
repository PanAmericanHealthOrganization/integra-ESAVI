import { Assessment } from "@mui/icons-material"
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
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material"
import { useEffect, useMemo, useState } from "react"

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

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Detalle de completitud por columna
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Columna</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="center">Total registros</TableCell>
                      <TableCell align="center">Valores con datos</TableCell>
                      <TableCell align="center">Valores nulos</TableCell>
                      <TableCell align="center">Completitud</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {columnasTabla
                      .slice()
                      .sort(
                        (a, b) =>
                          a.completenessPercentage - b.completenessPercentage
                      )
                      .map((column, index) => (
                        <TableRow key={`${column.columnName}-${index}`} hover>
                          <TableCell sx={{ maxWidth: 220 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}>
                              <Assessment color="primary" fontSize="small" />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  fontFamily: "monospace",
                                }}>
                                {column.columnName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 360 }}>
                            <Typography variant="body2" color="text.secondary">
                              {column.columnDescription || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {numberFormatter.format(column.totalRecords)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              color="success.main"
                              sx={{ fontWeight: 600 }}>
                              {numberFormatter.format(column.totalNonNulls)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              color="error.main"
                              sx={{ fontWeight: 600 }}>
                              {numberFormatter.format(column.totalNulls)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${column.completenessPercentage.toFixed(2)}%`}
                              color={
                                getStatusColor(
                                  column.completenessPercentage
                                ) as any
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}

export default CalidadCompletitud
