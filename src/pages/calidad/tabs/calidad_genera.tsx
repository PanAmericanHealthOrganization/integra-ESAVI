import { TrendingDown, TrendingFlat, TrendingUp } from "@mui/icons-material"
import { Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface QualityMetric {
  title: string
  value: string
  trend: "up" | "down" | "stable"
  percentage: string
}

const mockData: QualityMetric[] = [
  {
    title: "Casos Procesados",
    value: "2,847",
    trend: "up",
    percentage: "+12%",
  },
  {
    title: "Calidad Promedio",
    value: "94.2%",
    trend: "up",
    percentage: "+2.1%",
  },
  {
    title: "Errores Detectados",
    value: "23",
    trend: "down",
    percentage: "-15%",
  },
]

// Datos para los gráficos
const tendenciaData = [
  { mes: "Ene", calidad: 87.5 },
  { mes: "Feb", calidad: 89.2 },
  { mes: "Mar", calidad: 91.8 },
  { mes: "Abr", calidad: 90.5 },
  { mes: "May", calidad: 92.3 },
  { mes: "Jun", calidad: 94.2 },
]

const categoriaData = [
  { name: "Eventos Adversos", value: 85, color: "#3b82f6" },
  { name: "Vacunación", value: 92, color: "#10b981" },
  { name: "Seguimiento", value: 78, color: "#f59e0b" },
]

const erroresData = [
  { month: "Ene", errors: 45 },
  { month: "Feb", errors: 38 },
  { month: "Mar", errors: 32 },
  { month: "Abr", errors: 28 },
  { month: "May", errors: 25 },
  { month: "Jun", errors: 23 },
]

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]

export const CalidadGeneral = () => {
  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp sx={{ color: "success.main" }} />
      case "down":
        return <TrendingDown sx={{ color: "error.main" }} />
      case "stable":
        return <TrendingFlat sx={{ color: "grey.500" }} />
    }
  }

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "success"
      case "down":
        return "error"
      case "stable":
        return "default"
    }
  }

  return (
    <Box sx={{ p: 3, bgcolor: "grey.50", minHeight: "100vh" }}>
      <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {mockData.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} lg={3} xl={3} key={index}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom>
                    {metric.title}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mt: 2,
                    }}>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ fontWeight: "bold" }}>
                      {metric.value}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {getTrendIcon(metric.trend)}
                      <Chip
                        label={metric.percentage}
                        color={getTrendColor(metric.trend)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={12} md={8} lg={8} xl={8}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ mb: 2, fontWeight: "semibold" }}>
                  Tendencia de Calidad **** puede el porcentaje de calidad en
                  función del timpo, pero me iria por completitud
                </Typography>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tendenciaData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis domain={[80, 100]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="calidad"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ mb: 2, fontWeight: "semibold" }}>
                  De las columnas principales el que menor error maneja un top
                  10, quizá otro tipo de gráfico
                </Typography>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoriaData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}>
                        {categoriaData.map((entry, index) => (
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
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
            <Card>
              <CardContent>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ mb: 2, fontWeight: "semibold" }}>
                  Evolución de Errores Detectados
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={erroresData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="errors" fill="#ef4444" name="Errores" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
