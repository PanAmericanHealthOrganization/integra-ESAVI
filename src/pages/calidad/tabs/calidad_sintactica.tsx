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
import React, { useEffect, useState } from "react"
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

interface SyntaxError {
  field: string
  error_type: string
  error_count: number
  severity: "high" | "medium" | "low"
  examples: string[]
}

interface SyntaxMetric {
  title: string
  value: number
  total: number
  percentage: number
  status: "success" | "warning" | "error"
}

const CalidadSintactica: React.FC = () => {
  const [syntaxErrors, setSyntaxErrors] = useState<SyntaxError[]>([])
  const [metrics, setMetrics] = useState<SyntaxMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSyntaxData()
  }, [])

  const fetchSyntaxData = async () => {
    try {
      // Datos simulados - reemplazar con llamada real a la API
      const errorsData: SyntaxError[] = [
        {
          field: "email",
          error_type: "Formato inválido",
          error_count: 145,
          severity: "high",
          examples: ["usuario@", "email.com", "test@.com"],
        },
        {
          field: "telefono",
          error_type: "Caracteres no numéricos",
          error_count: 89,
          severity: "medium",
          examples: ["123-abc-456", "(555) xyz", "12345678901234"],
        },
        {
          field: "fecha_nacimiento",
          error_type: "Formato de fecha",
          error_count: 67,
          severity: "high",
          examples: ["32/13/2023", "2023-13-45", "abc-def-ghij"],
        },
        {
          field: "codigo_postal",
          error_type: "Longitud incorrecta",
          error_count: 34,
          severity: "low",
          examples: ["123", "1234567890", "ABC123"],
        },
      ]

      const metricsData: SyntaxMetric[] = [
        {
          title: "Registros Válidos",
          value: 8543,
          total: 10000,
          percentage: 85.43,
          status: "warning",
        },
        {
          title: "Emails Válidos",
          value: 9145,
          total: 10000,
          percentage: 91.45,
          status: "success",
        },
        {
          title: "Teléfonos Válidos",
          value: 8911,
          total: 10000,
          percentage: 89.11,
          status: "warning",
        },
        {
          title: "Fechas Válidas",
          value: 9333,
          total: 10000,
          percentage: 93.33,
          status: "success",
        },
      ]

      setSyntaxErrors(errorsData)
      setMetrics(metricsData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching syntax data:", error)
      setLoading(false)
    }
  }

  const errorsByType = syntaxErrors.map((error) => ({
    name: error.error_type,
    value: error.error_count,
    color:
      error.severity === "high"
        ? "#ef4444"
        : error.severity === "medium"
          ? "#f59e0b"
          : "#10b981",
  }))

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <Error color="error" />
      case "medium":
        return <Warning color="warning" />
      case "low":
        return <CheckCircle color="success" />
      default:
        return <Code />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "success"
      case "warning":
        return "warning"
      case "error":
        return "error"
      default:
        return "default"
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}>
        <Typography variant="h6">
          Cargando datos de validación sintáctica...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: "bold" }}>
        Calidad Sintáctica de Datos
      </Typography>

      {/* Métricas principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {metric.title}
                </Typography>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{ fontWeight: "bold", mb: 1 }}>
                  {metric.percentage}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metric.percentage}
                  sx={{ mb: 1, height: 8, borderRadius: 4 }}
                  color={getStatusColor(metric.status) as any}
                />
                <Typography variant="body2" color="text.secondary">
                  {metric.value.toLocaleString()} de{" "}
                  {metric.total.toLocaleString()}
                </Typography>
                <Chip
                  label={
                    metric.status === "success"
                      ? "Excelente"
                      : metric.status === "warning"
                        ? "Aceptable"
                        : "Crítico"
                  }
                  color={getStatusColor(metric.status) as any}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Gráfico de errores por tipo */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribución de Errores Sintácticos
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={syntaxErrors}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="field" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="error_count" fill="#ef4444" name="Errores" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico circular de tipos de error */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Errores por Tipo
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={errorsByType}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}>
                      {errorsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Lista detallada de errores */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detalle de Errores Sintácticos
              </Typography>
              <List>
                {syntaxErrors.map((error, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      {getSeverityIcon(error.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "bold" }}>
                            {error.field}
                          </Typography>
                          <Chip
                            label={error.error_type}
                            size="small"
                            color={
                              error.severity === "high"
                                ? "error"
                                : error.severity === "medium"
                                  ? "warning"
                                  : "success"
                            }
                          />
                          <Typography variant="body2" color="error">
                            {error.error_count} errores
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom>
                            Ejemplos de errores:
                          </Typography>
                          <Box
                            sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            {error.examples.map((example, idx) => (
                              <Chip
                                key={idx}
                                label={example}
                                size="small"
                                variant="outlined"
                                sx={{ fontFamily: "monospace" }}
                              />
                            ))}
                          </Box>
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
          La validación sintáctica verifica que los datos cumplan con los
          formatos y estructuras esperadas. Los errores de alta severidad
          requieren atención inmediata.
        </Typography>
      </Alert>
    </Box>
  )
}

export default CalidadSintactica
