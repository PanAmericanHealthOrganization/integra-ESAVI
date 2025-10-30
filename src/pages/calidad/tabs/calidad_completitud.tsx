import { Box, Button, Card, CardContent, Grid, Typography } from "@mui/material"
import React, { useEffect, useState } from "react"
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

interface CompletenessData {
  column: string
  vacunacion: number
  persona: number
  notificacion: number
}

const CalidadCompletitud: React.FC = () => {
  const [completenessData, setCompletenessData] = useState<CompletenessData[]>(
    []
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompletenessData()
  }, [])

  const fetchCompletenessData = async () => {
    try {
      // Simulated data - replace with actual API call
      const data: CompletenessData[] = [
        { column: "id", vacunacion: 98, persona: 99, notificacion: 97 },
        { column: "fecha", vacunacion: 85, persona: 90, notificacion: 88 },
        { column: "tipo", vacunacion: 92, persona: 95, notificacion: 89 },
        { column: "estado", vacunacion: 78, persona: 82, notificacion: 75 },
        {
          column: "observaciones",
          vacunacion: 45,
          persona: 60,
          notificacion: 52,
        },
        { column: "ubicacion", vacunacion: 88, persona: 91, notificacion: 85 },
      ]

      setCompletenessData(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching completeness data:", error)
      setLoading(false)
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
        <Typography variant="h6">Cargando datos de completitud...</Typography>
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
          Dashboard de Completitud de Datos
        </Typography>
        <Button variant="contained" onClick={fetchCompletenessData}>
          Actualizar
        </Button>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Completitud por Columna (%)
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={completenessData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="column" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value) => [`${value}%`, ""]}
                  labelFormatter={(label) => `Columna: ${label}`}
                />
                <Legend />
                <Bar dataKey="vacunacion" fill="#8884d8" name="Vacunación" />
                <Bar dataKey="persona" fill="#82ca9d" name="Persona" />
                <Bar
                  dataKey="notificacion"
                  fill="#ffc658"
                  name="Notificación"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: "primary.main" }}>
                Tabla Vacunación
              </Typography>
              <Box sx={{ mt: 2 }}>
                {completenessData.map((item) => (
                  <Box
                    key={`vac-${item.column}`}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 1,
                    }}>
                    <Typography variant="body2">{item.column}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {item.vacunacion}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: "success.main" }}>
                Tabla Persona
              </Typography>
              <Box sx={{ mt: 2 }}>
                {completenessData.map((item) => (
                  <Box
                    key={`per-${item.column}`}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 1,
                    }}>
                    <Typography variant="body2">{item.column}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {item.persona}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: "warning.main" }}>
                Tabla Notificación
              </Typography>
              <Box sx={{ mt: 2 }}>
                {completenessData.map((item) => (
                  <Box
                    key={`not-${item.column}`}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 1,
                    }}>
                    <Typography variant="body2">{item.column}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {item.notificacion}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default CalidadCompletitud
