import { Box, Card, CardContent, Grid, Typography } from "@mui/material"
import { Show, SimpleShowLayout, TextField, useShowContext } from "react-admin"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const GenderChart = () => {
  const { record } = useShowContext()

  if (!record) return null

  const data = [
    {
      name: "Hombres",
      total: Number(record.totalHombres) || 0,
    },
    {
      name: "Mujeres",
      total: Number(record.totalMujeres) || 0,
    },
  ]

  const COLORS = ["#2196F3", "#E91E63"]

  return (
    <Card sx={{ mt: 2, height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Distribución por Género
        </Typography>
        <Box sx={{ width: "100%", height: 350 }}>
          <ResponsiveContainer>
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Total" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  )
}

const VacunometroShow = () => {
  return (
    <Show>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SimpleShowLayout>
            <TextField source="id" />
            <TextField source="unicodigo" label="Unicodigo" />
            <TextField source="fechaAplicacion" label="Fecha de Aplicación" />
            <TextField source="nombreVacuna" />
          </SimpleShowLayout>
        </Grid>
        <Grid item xs={12} md={6}>
          <GenderChart />
        </Grid>
      </Grid>
    </Show>
  )
}

export default VacunometroShow
