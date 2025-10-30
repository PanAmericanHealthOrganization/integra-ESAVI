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
import React, { useEffect, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface SemanticRule {
  id: string
  name: string
  description: string
  violations: number
  severity: "critical" | "high" | "medium" | "low"
  field: string
  rule_type:
    | "referential_integrity"
    | "business_logic"
    | "consistency"
    | "domain_validation"
}

interface SemanticMetric {
  title: string
  value: number
  total: number
  percentage: number
  trend: "up" | "down" | "stable"
  status: "success" | "warning" | "error"
}

interface ConsistencyCheck {
  field_pair: string
  consistent_records: number
  inconsistent_records: number
  consistency_rate: number
}

const CalidadSemantica: React.FC = () => {
  const [semanticRules, setSemanticRules] = useState<SemanticRule[]>([])
  const [metrics, setMetrics] = useState<SemanticMetric[]>([])
  const [consistencyChecks, setConsistencyChecks] = useState<
    ConsistencyCheck[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSemanticData()
  }, [])

  const fetchSemanticData = async () => {
    try {
      // Datos simulados - reemplazar con llamada real a la API
      const rulesData: SemanticRule[] = [
        {
          id: "R001",
          name: "Edad vs Fecha Nacimiento",
          description:
            "La edad calculada debe coincidir con la fecha de nacimiento",
          violations: 23,
          severity: "high",
          field: "edad, fecha_nacimiento",
          rule_type: "consistency",
        },
        {
          id: "R002",
          name: "Código Vacuna Válido",
          description:
            "El código de vacuna debe existir en el catálogo oficial",
          violations: 8,
          severity: "critical",
          field: "codigo_vacuna",
          rule_type: "referential_integrity",
        },
        {
          id: "R003",
          name: "Dosis vs Esquema",
          description:
            "El número de dosis debe ser válido para el esquema de vacunación",
          violations: 45,
          severity: "medium",
          field: "numero_dosis, esquema_vacunacion",
          rule_type: "business_logic",
        },
        {
          id: "R004",
          name: "Edad Mínima Vacuna",
          description: "La edad debe ser compatible con la vacuna administrada",
          violations: 12,
          severity: "high",
          field: "edad, tipo_vacuna",
          rule_type: "business_logic",
        },
        {
          id: "R005",
          name: "Ubicación Geográfica",
          description:
            "El código de ubicación debe existir en el catálogo geográfico",
          violations: 67,
          severity: "medium",
          field: "codigo_ubicacion",
          rule_type: "referential_integrity",
        },
      ]

      const metricsData: SemanticMetric[] = [
        {
          title: "Integridad Referencial",
          value: 9823,
          total: 10000,
          percentage: 98.23,
          trend: "up",
          status: "success",
        },
        {
          title: "Reglas de Negocio",
          value: 9543,
          total: 10000,
          percentage: 95.43,
          trend: "stable",
          status: "success",
        },
        {
          title: "Consistencia Interna",
          value: 9177,
          total: 10000,
          percentage: 91.77,
          trend: "down",
          status: "warning",
        },
        {
          title: "Validación de Dominio",
          value: 9633,
          total: 10000,
          percentage: 96.33,
          trend: "up",
          status: "success",
        },
      ]

      const consistencyData: ConsistencyCheck[] = [
        {
          field_pair: "edad - fecha_nacimiento",
          consistent_records: 9777,
          inconsistent_records: 223,
          consistency_rate: 97.77,
        },
        {
          field_pair: "dosis - esquema_vacunacion",
          consistent_records: 9555,
          inconsistent_records: 445,
          consistency_rate: 95.55,
        },
        {
          field_pair: "vacuna - edad_minima",
          consistent_records: 9888,
          inconsistent_records: 112,
          consistency_rate: 98.88,
        },
        {
          field_pair: "ubicacion - codigo_postal",
          consistent_records: 9333,
          inconsistent_records: 667,
          consistency_rate: 93.33,
        },
      ]

      setSemanticRules(rulesData)
      setMetrics(metricsData)
      setConsistencyChecks(consistencyData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching semantic data:", error)
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "error"
      case "high":
        return "error"
      case "medium":
        return "warning"
      case "low":
        return "info"
      default:
        return "default"
    }
  }

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case "referential_integrity":
        return "Integridad Referencial"
      case "business_logic":
        return "Lógica de Negocio"
      case "consistency":
        return "Consistencia"
      case "domain_validation":
        return "Validación de Dominio"
      default:
        return type
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return "↗️"
      case "down":
        return "↘️"
      case "stable":
        return "→"
      default:
        return "→"
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
          Cargando datos de validación semántica...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: "bold" }}>
        Calidad Semántica de Datos
      </Typography>

      {/* Métricas principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Psychology color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {metric.title}
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{ fontWeight: "bold", mb: 1 }}>
                  {metric.percentage}%
                </Typography>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Typography variant="body2">
                    {getTrendIcon(metric.trend)}
                  </Typography>
                  <Chip
                    label={
                      metric.status === "success"
                        ? "Excelente"
                        : metric.status === "warning"
                          ? "Aceptable"
                          : "Crítico"
                    }
                    color={metric.status as any}
                    size="small"
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metric.percentage}
                  sx={{ mb: 1, height: 6, borderRadius: 3 }}
                  color={metric.status as any}
                />
                <Typography variant="body2" color="text.secondary">
                  {metric.value.toLocaleString()} /{" "}
                  {metric.total.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Gráfico de violaciones por regla */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Violaciones por Regla Semántica
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={semanticRules}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="violations"
                      fill="#f59e0b"
                      name="Violaciones"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de consistencia */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Consistencia por Campos
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={consistencyChecks}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="field_pair"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis domain={[90, 100]} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Consistencia"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="consistency_rate"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de reglas semánticas */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detalle de Reglas Semánticas
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Regla</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Campo(s)</TableCell>
                      <TableCell>Violaciones</TableCell>
                      <TableCell>Severidad</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {semanticRules.map((rule) => (
                      <TableRow key={rule.id} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}>
                            {rule.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}>
                            {rule.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rule.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getRuleTypeLabel(rule.rule_type)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}>
                            {rule.field}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color="error"
                            sx={{ fontWeight: "bold" }}>
                            {rule.violations}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={rule.severity}
                            color={getSeverityColor(rule.severity) as any}
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
        </Grid>

        {/* Tabla de consistencia */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Análisis de Consistencia
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Campos Relacionados</TableCell>
                      <TableCell>Registros Consistentes</TableCell>
                      <TableCell>Registros Inconsistentes</TableCell>
                      <TableCell>Tasa de Consistencia</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consistencyChecks.map((check, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}>
                            {check.field_pair}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="success.main">
                            {check.consistent_records.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error.main">
                            {check.inconsistent_records.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}>
                            {check.consistency_rate}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              check.consistency_rate >= 95
                                ? "Excelente"
                                : check.consistency_rate >= 90
                                  ? "Bueno"
                                  : "Mejorable"
                            }
                            color={
                              check.consistency_rate >= 95
                                ? "success"
                                : check.consistency_rate >= 90
                                  ? "warning"
                                  : "error"
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
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          La validación semántica verifica que los datos tengan sentido en el
          contexto del dominio de negocio. Incluye reglas de integridad
          referencial, lógica de negocio y consistencia entre campos
          relacionados.
        </Typography>
      </Alert>
    </Box>
  )
}

export default CalidadSemantica
