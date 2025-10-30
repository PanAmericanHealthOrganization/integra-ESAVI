import {
  AccessTime,
  History,
  Schedule,
  TrendingDown,
  TrendingUp,
  Update,
} from "@mui/icons-material"
import {
  Alert,
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
  Tab,
  Tabs,
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
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface TemporalMetric {
  title: string
  value: string
  trend: "up" | "down" | "stable"
  percentage: string
  description: string
  icon: React.ReactNode
}

interface DataFreshness {
  table: string
  last_update: string
  hours_since_update: number
  expected_frequency: string
  status: "fresh" | "stale" | "critical"
  record_count: number
}

interface TemporalTrend {
  date: string
  records_created: number
  records_updated: number
  avg_processing_time: number
  data_volume: number
}

interface DataLatency {
  process: string
  avg_latency: number
  max_latency: number
  min_latency: number
  p95_latency: number
  target_sla: number
}

const CalidadTemporal: React.FC = () => {
  const [metrics, setMetrics] = useState<TemporalMetric[]>([])
  const [freshness, setFreshness] = useState<DataFreshness[]>([])
  const [trends, setTrends] = useState<TemporalTrend[]>([])
  const [latency, setLatency] = useState<DataLatency[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState("7d")
  const [currentTab, setCurrentTab] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemporalData()
  }, [selectedPeriod])

  const fetchTemporalData = async () => {
    try {
      // Datos simulados - reemplazar con llamada real a la API
      const metricsData: TemporalMetric[] = [
        {
          title: "Datos Actualizados",
          value: "94.2%",
          trend: "up",
          percentage: "+2.1%",
          description: "Porcentaje de datos actualizados en las últimas 24h",
          icon: <Update />,
        },
        {
          title: "Latencia Promedio",
          value: "2.4m",
          trend: "down",
          percentage: "-15%",
          description: "Tiempo promedio de procesamiento de datos",
          icon: <AccessTime />,
        },
        {
          title: "Frecuencia de Carga",
          value: "6.2/h",
          trend: "stable",
          percentage: "0%",
          description: "Cargas de datos por hora",
          icon: <Schedule />,
        },
        {
          title: "Retraso Máximo",
          value: "45m",
          trend: "up",
          percentage: "+8%",
          description: "Mayor retraso detectado en el procesamiento",
          icon: <History />,
        },
      ]

      const freshnessData: DataFreshness[] = [
        {
          table: "vacunacion",
          last_update: "2024-10-29T14:30:00",
          hours_since_update: 2.5,
          expected_frequency: "Cada 4 horas",
          status: "fresh",
          record_count: 15420,
        },
        {
          table: "persona",
          last_update: "2024-10-29T10:15:00",
          hours_since_update: 6.75,
          expected_frequency: "Cada 6 horas",
          status: "stale",
          record_count: 8934,
        },
        {
          table: "notificacion",
          last_update: "2024-10-29T16:45:00",
          hours_since_update: 0.25,
          expected_frequency: "Cada 1 hora",
          status: "fresh",
          record_count: 2847,
        },
        {
          table: "evento_adverso",
          last_update: "2024-10-28T18:20:00",
          hours_since_update: 22.67,
          expected_frequency: "Cada 12 horas",
          status: "critical",
          record_count: 234,
        },
        {
          table: "catalogo_vacunas",
          last_update: "2024-10-27T09:00:00",
          hours_since_update: 55,
          expected_frequency: "Cada semana",
          status: "fresh",
          record_count: 45,
        },
      ]

      const trendsData: TemporalTrend[] = [
        {
          date: "2024-10-23",
          records_created: 1250,
          records_updated: 340,
          avg_processing_time: 180,
          data_volume: 45.2,
        },
        {
          date: "2024-10-24",
          records_created: 1180,
          records_updated: 290,
          avg_processing_time: 165,
          data_volume: 42.8,
        },
        {
          date: "2024-10-25",
          records_created: 1350,
          records_updated: 425,
          avg_processing_time: 190,
          data_volume: 48.5,
        },
        {
          date: "2024-10-26",
          records_created: 1420,
          records_updated: 380,
          avg_processing_time: 145,
          data_volume: 52.1,
        },
        {
          date: "2024-10-27",
          records_created: 1290,
          records_updated: 310,
          avg_processing_time: 155,
          data_volume: 46.9,
        },
        {
          date: "2024-10-28",
          records_created: 1380,
          records_updated: 445,
          avg_processing_time: 140,
          data_volume: 51.3,
        },
        {
          date: "2024-10-29",
          records_created: 1450,
          records_updated: 520,
          avg_processing_time: 135,
          data_volume: 54.7,
        },
      ]

      const latencyData: DataLatency[] = [
        {
          process: "Ingesta de Datos",
          avg_latency: 120,
          max_latency: 340,
          min_latency: 45,
          p95_latency: 280,
          target_sla: 180,
        },
        {
          process: "Validación",
          avg_latency: 85,
          max_latency: 150,
          min_latency: 30,
          p95_latency: 135,
          target_sla: 120,
        },
        {
          process: "Transformación",
          avg_latency: 200,
          max_latency: 450,
          min_latency: 90,
          p95_latency: 380,
          target_sla: 300,
        },
        {
          process: "Carga Final",
          avg_latency: 65,
          max_latency: 120,
          min_latency: 25,
          p95_latency: 105,
          target_sla: 90,
        },
      ]

      setMetrics(metricsData)
      setFreshness(freshnessData)
      setTrends(trendsData)
      setLatency(latencyData)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching temporal data:", error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "fresh":
        return "success"
      case "stale":
        return "warning"
      case "critical":
        return "error"
      default:
        return "default"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "fresh":
        return "Actualizado"
      case "stale":
        return "Desactualizado"
      case "critical":
        return "Crítico"
      default:
        return status
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp sx={{ color: "success.main" }} />
      case "down":
        return <TrendingDown sx={{ color: "error.main" }} />
      default:
        return <TrendingUp sx={{ color: "grey.500" }} />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
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
          Cargando datos de calidad temporal...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Calidad Temporal de Datos
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={selectedPeriod}
              label="Período"
              onChange={(e) => setSelectedPeriod(e.target.value)}>
              <MenuItem value="1d">Último día</MenuItem>
              <MenuItem value="7d">Última semana</MenuItem>
              <MenuItem value="30d">Último mes</MenuItem>
              <MenuItem value="90d">Últimos 3 meses</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={fetchTemporalData}>
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Métricas principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  {metric.icon}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}>
                    {metric.title}
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{ fontWeight: "bold", mb: 1 }}>
                  {metric.value}
                </Typography>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  {getTrendIcon(metric.trend)}
                  <Chip
                    label={metric.percentage}
                    color={
                      metric.trend === "up"
                        ? "success"
                        : metric.trend === "down"
                          ? "error"
                          : "default"
                    }
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {metric.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs para diferentes vistas */}
      <Card sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="Frescura de Datos" />
            <Tab label="Tendencias Temporales" />
            <Tab label="Latencias" />
          </Tabs>
        </Box>

        {/* Tab 1: Frescura de Datos */}
        {currentTab === 0 && (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Estado de Actualización por Tabla
            </Typography>
            <Grid container spacing={2}>
              {freshness.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}>
                        <Typography
                          variant="h6"
                          sx={{ fontFamily: "monospace" }}>
                          {item.table}
                        </Typography>
                        <Chip
                          label={getStatusLabel(item.status)}
                          color={getStatusColor(item.status) as any}
                          size="small"
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom>
                        Última actualización: {formatDate(item.last_update)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom>
                        Hace {item.hours_since_update.toFixed(1)} horas
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom>
                        Frecuencia esperada: {item.expected_frequency}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {item.record_count.toLocaleString()} registros
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        )}

        {/* Tab 2: Tendencias Temporales */}
        {currentTab === 1 && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Typography variant="h6" gutterBottom>
                  Volumen de Datos en el Tiempo
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="records_created"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        name="Registros Creados"
                      />
                      <Area
                        type="monotone"
                        dataKey="records_updated"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        name="Registros Actualizados"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Typography variant="h6" gutterBottom>
                  Tiempo de Procesamiento
                </Typography>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}s`, "Tiempo"]} />
                      <Line
                        type="monotone"
                        dataKey="avg_processing_time"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ fill: "#f59e0b", strokeWidth: 2 }}
                        name="Tiempo Promedio (s)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Tab 3: Latencias */}
        {currentTab === 2 && (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Latencias por Proceso
            </Typography>
            <Box sx={{ height: 400, mb: 3 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="process" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}s`, ""]} />
                  <Legend />
                  <Bar
                    dataKey="avg_latency"
                    fill="#3b82f6"
                    name="Latencia Promedio"
                  />
                  <Bar
                    dataKey="p95_latency"
                    fill="#f59e0b"
                    name="Percentil 95"
                  />
                  <Bar
                    dataKey="target_sla"
                    fill="#ef4444"
                    name="SLA Objetivo"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <Grid container spacing={2}>
              {latency.map((item, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {item.process}
                      </Typography>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Promedio: {item.avg_latency}s
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          P95: {item.p95_latency}s
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          SLA: {item.target_sla}s
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          item.avg_latency <= item.target_sla
                            ? "Cumple SLA"
                            : "Excede SLA"
                        }
                        color={
                          item.avg_latency <= item.target_sla
                            ? "success"
                            : "error"
                        }
                        size="small"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        )}
      </Card>

      <Alert severity="info">
        <Typography variant="body2">
          La calidad temporal evalúa la actualidad, frecuencia y latencia de los
          datos. Monitorea la frescura de la información y el cumplimiento de
          los SLAs de procesamiento.
        </Typography>
      </Alert>
    </Box>
  )
}

export default CalidadTemporal
