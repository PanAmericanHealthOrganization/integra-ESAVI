import { CheckCircle, Code, Error, Warning } from "@mui/icons-material"
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material"
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
    const totalInvalidos = totalRegistros - totalValidos
    const promedioValidez =
      reglas.reduce(
        (acc, item) => acc + item.porcentajeRegistrosValidos,
        0
      ) / totalReglas
    const reglasCriticas = reglas.filter(
      (item) => item.porcentajeRegistrosValidos < 80
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

  const graficoReglas = useMemo(
    () =>
      reglas.map((regla) => ({
        nombre: regla.regla,
        porcentaje: Number(regla.porcentajeRegistrosValidos.toFixed(2)),
        validos: regla.totalRegistrosValidos,
        registros: regla.totalRegistros,
      })),
    [reglas]
  )

  const distribucionValidacion = useMemo(() => {
    if (!resumen) return []

    return [
      {
        nombre: "Registros válidos",
        valor: resumen.totalValidos,
        color: "#16a34a",
      },
      {
        nombre: "Registros inválidos",
        valor: resumen.totalInvalidos,
        color: "#ef4444",
      },
    ].filter((item) => item.valor > 0)
  }, [resumen])

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
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: "bold" }}>
        Calidad sintáctica de datos
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
                Promedio de validez
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
                {resumen.totalValidos.toLocaleString()}
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
                Menos del 80% de registros válidos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Porcentaje de registros válidos por regla
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graficoReglas} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis type="category" dataKey="nombre" width={260} />
                    <Tooltip formatter={(value) => [`${value}%`, "Validez"]} />
                    <Legend />
                    <Bar
                      dataKey="porcentaje"
                      name="% registros válidos"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Distribución global
              </Typography>
              <Box sx={{ height: 320 }}>
                {distribucionValidacion.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribucionValidacion}
                        dataKey="valor"
                        nameKey="nombre"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ nombre, valor }) =>
                          `${nombre}: ${valor.toLocaleString()}`
                        }>
                        {distribucionValidacion.map((entry) => (
                          <Cell key={entry.nombre} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          (value as number).toLocaleString(),
                          "Registros",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Detalle de reglas sintácticas
              </Typography>
              <List>
                {reglas
                  .slice()
                  .sort(
                    (a, b) =>
                      a.porcentajeRegistrosValidos -
                      b.porcentajeRegistrosValidos
                  )
                  .map((regla, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        {getSeverityIcon(regla.porcentajeRegistrosValidos)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              flexWrap: "wrap",
                            }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: "bold" }}>
                              {regla.regla}
                            </Typography>
                            <Chip
                              label={`${regla.porcentajeRegistrosValidos.toFixed(2)}% válidos`}
                              color={
                                getStatusColor(
                                  regla.porcentajeRegistrosValidos
                                ) as any
                              }
                              size="small"
                            />
                            <Typography variant="body2" color="error">
                              {(
                                regla.totalRegistros -
                                regla.totalRegistrosValidos
                              ).toLocaleString()}{" "}
                              registros inválidos
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              gutterBottom>
                              {regla.condicion}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {regla.descripcionRegla}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          La validación sintáctica comprueba que cada campo cumpla con el formato
          esperado (longitud, caracteres admitidos y estructura). Prioriza la
          revisión de las reglas marcadas como críticas.
        </Typography>
      </Alert>
    </Box>
  )
}

export default CalidadSintactica
