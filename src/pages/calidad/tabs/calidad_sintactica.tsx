import { CheckCircle, Error, Warning } from "@mui/icons-material"
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
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useCalidadDataQuality } from "../calidadDataQualityContext"

const numberFormatter = new Intl.NumberFormat("es-ES")

const getStatusColor = (percentage: number) => {
  if (percentage >= 95) return "success"
  if (percentage >= 80) return "warning"
  return "error"
}

const getStatusLabel = (percentage: number) => {
  if (percentage >= 95) return "Excelente"
  if (percentage >= 80) return "Aceptable"
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
      Cargando datos de validación sintáctica…
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
      No existen resultados de reglas sintácticas para la fecha seleccionada.
    </Typography>
  </Box>
)

const CalidadSintactica: React.FC = () => {
  const { data, loading } = useCalidadDataQuality()
  const reglas = data?.sintacticQuality ?? []

  const resumen = useMemo(() => {
    if (reglas.length === 0) {
      return null
    }

    const totalReglas = reglas.length
    const totalRegistros = reglas.reduce(
      (acc, item) => acc + item.totalRegistros,
      0
    )
    const totalValidos = reglas.reduce(
      (acc, item) => acc + item.totalRegistrosValidos,
      0
    )
    const totalInvalidos = reglas.reduce(
      (acc, item) => acc + item.totalRegistrosInvalidos,
      0
    )
    const promedioValidez =
      reglas.reduce((acc, item) => acc + item.porcentajeRegistrosValidos, 0) /
      totalReglas
    const promedioInvalidez =
      reglas.reduce((acc, item) => acc + item.porcentajeRegistrosInvalidos, 0) /
      totalReglas
    const reglasCriticas = reglas.filter(
      (item) => item.porcentajeRegistrosValidos < 80
    ).length

    return {
      totalReglas,
      totalRegistros,
      totalValidos,
      totalInvalidos,
      promedioValidez,
      promedioInvalidez,
      reglasCriticas,
    }
  }, [reglas])

  const rankingExactitud = useMemo(
    () =>
      reglas
        .slice()
        .sort(
          (a, b) => a.porcentajeRegistrosValidos - b.porcentajeRegistrosValidos
        )
        .slice(0, 5)
        .map((regla) => ({
          nombre: regla.regla,
          porcentaje: Number(regla.porcentajeRegistrosValidos.toFixed(2)),
          validos: regla.totalRegistrosValidos,
          registros: regla.totalRegistros,
        })),
    [reglas]
  )

  const getSeverityIcon = (percentage: number) => {
    if (percentage >= 95) return <CheckCircle color="success" />
    if (percentage >= 80) return <Warning color="warning" />
    return <Error color="error" />
  }

  if (loading) {
    return <LoadingState />
  }

  if (!resumen) {
    return <EmptyState />
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
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
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Promedio de exactitud
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
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Promedio de inexactitud
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", mt: 1, color: "error.main" }}>
                {resumen.promedioInvalidez.toFixed(2)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={resumen.promedioInvalidez}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
                color="error"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Registros válidos
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                {resumen.totalValidos.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Registros inválidos
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", mt: 1, color: "error.main" }}>
                {resumen.totalInvalidos.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Ranking de exactitud por regla (Top 5)
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rankingExactitud} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis type="category" dataKey="nombre" width={260} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Exactitud"]}
                    />
                    <Legend />
                    <Bar
                      dataKey="porcentaje"
                      name="% registros correctos"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Detalle de reglas de exactitud (validaciones sintácticas)
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Código / Regla</TableCell>
                      <TableCell>Subdimensión</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="center">Registros válidos</TableCell>
                      <TableCell align="center">Registros inválidos</TableCell>
                      <TableCell align="center">Porcentajes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reglas
                      .slice()
                      .sort(
                        (a, b) =>
                          a.porcentajeRegistrosValidos -
                          b.porcentajeRegistrosValidos
                      )
                      .map((regla, index) => (
                        <TableRow key={regla.codigo || `regla-${index}`} hover>
                          <TableCell sx={{ maxWidth: 220 }}>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.5,
                              }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}>
                                <CheckCircle color="primary" fontSize="small" />
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600 }}>
                                  {regla.regla}
                                </Typography>
                              </Box>
                              {regla.codigo && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontFamily: "monospace", ml: 3 }}>
                                  {regla.codigo}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Typography variant="caption" color="primary.main">
                              {regla.subDimension || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 360 }}>
                            <Typography variant="body2" color="text.secondary">
                              {regla.descripcionRegla}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              color="success.main"
                              sx={{ fontWeight: 600 }}>
                              {numberFormatter.format(
                                regla.totalRegistrosValidos
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              color="error.main"
                              sx={{ fontWeight: 600 }}>
                              {numberFormatter.format(
                                regla.totalRegistrosInvalidos
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                flexDirection: "column",
                                alignItems: "center",
                              }}>
                              <Chip
                                label={`${regla.porcentajeRegistrosValidos.toFixed(2)}% válidos`}
                                color={
                                  getStatusColor(
                                    regla.porcentajeRegistrosValidos
                                  ) as any
                                }
                                size="small"
                              />
                              <Chip
                                label={`${regla.porcentajeRegistrosInvalidos.toFixed(2)}% inválidos`}
                                color="error"
                                size="small"
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          La dimensión de exactitud verifica que cada campo cumpla con el
          formato esperado (longitud, caracteres y estructura). Priorice las
          reglas críticas para elevar el porcentaje global.
        </Typography>
      </Alert>
    </Box>
  )
}

export default CalidadSintactica
