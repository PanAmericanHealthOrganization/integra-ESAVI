import { Psychology } from "@mui/icons-material"
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material"
import { useMemo } from "react"
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
  if (percentage >= 85) return "warning"
  return "error"
}

const getStatusLabel = (percentage: number) => {
  if (percentage >= 95) return "Excelente"
  if (percentage >= 85) return "Aceptable"
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
    <Typography variant="h6">
      Cargando datos de validación semántica…
    </Typography>
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
      No existen resultados de reglas semánticas para la fecha seleccionada.
    </Typography>
  </Box>
)

const CalidadSemantica: React.FC = () => {
  const { data, loading } = useCalidadDataQuality()
  const reglas = data?.semanticQuality ?? []

  const resumen = useMemo(() => {
    if (reglas.length === 0) return null

    const totalReglas = reglas.length
    const totalRegistros = reglas.reduce(
      (acc, regla) => acc + regla.totalRecords,
      0
    )
    const totalValidos = reglas.reduce(
      (acc, regla) => acc + regla.totalValidRecords,
      0
    )
    const totalInvalidos = reglas.reduce(
      (acc, regla) => acc + regla.totalInvalidRecords,
      0
    )
    const promedioValidez =
      reglas.reduce((acc, regla) => acc + regla.percentageValidRecords, 0) /
      totalReglas
    const reglasCriticas = reglas.filter(
      (regla) => regla.percentageValidRecords < 85
    ).length

    return {
      totalReglas,
      totalRegistros,
      totalValidos,
      totalInvalidos,
      promedioValidez,
      reglasCriticas,
    }
  }, [reglas])

  const topReglasConIncumplimientos = useMemo(() => {
    return reglas
      .slice()
      .sort((a, b) => b.totalInvalidRecords - a.totalInvalidRecords)
      .slice(0, 5)
      .map((regla) => ({
        regla: regla.ruleName,
        invalidos: regla.totalInvalidRecords,
        porcentajeInvalido: Number(regla.percentageInvalidRecords.toFixed(2)),
        validos: regla.totalValidRecords,
      }))
  }, [reglas])

  const tablaReglas = useMemo(
    () =>
      reglas
        .slice()
        .sort((a, b) => a.percentageValidRecords - b.percentageValidRecords),
    [reglas]
  )

  if (loading) {
    return <LoadingState />
  }

  if (!resumen) {
    return <EmptyState />
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: "bold" }}>
        Consistencia de datos
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Reglas evaluadas
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                {resumen.totalReglas}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Promedio de consistencia
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                {resumen.promedioValidez.toFixed(2)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={resumen.promedioValidez}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
                color={getStatusColor(resumen.promedioValidez) as any}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Registros válidos
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                {numberFormatter.format(resumen.totalValidos)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Reglas críticas
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                {resumen.reglasCriticas}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Menos del 85% de registros coherentes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Ranking de inconsistencias (Top 5)
              </Typography>
              <Box sx={{ height: 360 }}>
                {topReglasConIncumplimientos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topReglasConIncumplimientos}
                      layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="regla" width={260} />
                      <Tooltip
                        formatter={(value) => [
                          numberFormatter.format(value as number),
                          "Inconsistencias",
                        ]}
                      />
                      <Bar
                        dataKey="invalidos"
                        name="Registros inconsistentes"
                        fill="#ef4444"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Resumen de consistencia
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total de registros evaluados
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    {numberFormatter.format(resumen.totalRegistros)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Registros inconsistentes
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: "bold", color: "error.main" }}>
                    {numberFormatter.format(resumen.totalInvalidos)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Consistencia promedio
                  </Typography>
                  <Chip
                    label={getStatusLabel(resumen.promedioValidez)}
                    color={getStatusColor(resumen.promedioValidez) as any}
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Detalle de reglas de consistencia
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Regla</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Registros válidos</TableCell>
                  <TableCell>Registros inválidos</TableCell>
                  <TableCell>% válido</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tablaReglas.map((regla) => (
                  <TableRow key={regla.ruleCode} hover>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Psychology color="primary" fontSize="small" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {regla.ruleName}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontFamily: "monospace" }}>
                        {regla.ruleCode}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 360 }}>
                      <Typography variant="body2" color="text.secondary">
                        {regla.ruleDescription}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="success.main">
                        {numberFormatter.format(regla.totalValidRecords)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="error.main">
                        {numberFormatter.format(regla.totalInvalidRecords)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${regla.percentageValidRecords.toFixed(2)}%`}
                        color={
                          getStatusColor(regla.percentageValidRecords) as any
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

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          La dimensión de consistencia verifica la coherencia entre variables
          relacionadas. Priorice las reglas críticas para alinear los datos
          entre sistemas y detectar discrepancias recurrentes.
        </Typography>
      </Alert>
    </Box>
  )
}

export default CalidadSemantica
