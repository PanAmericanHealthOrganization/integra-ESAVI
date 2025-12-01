import {
  Alert,
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Typography,
} from "@mui/material"
import { useMemo } from "react"

import { useCalidadDataQuality } from "../calidadDataQualityContext"
import { TablaProblemasCalidad } from "../components"

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
  const { data, loading, selectedDate } = useCalidadDataQuality()
  const reglas = data?.semanticQuality ?? []
  // Extraer año y mes de la fecha seleccionada
  const anio = selectedDate ? parseInt(selectedDate.split("-")[0]) : undefined
  const mes = selectedDate ? parseInt(selectedDate.split("-")[1]) : undefined

  // Función de descarga (placeholder)
  const handleDownload = (codigo: string, anio: number, mes: number) => {
    console.log("Descargar datos para:", { codigo, anio, mes })
    // TODO: Implementar lógica de descarga
  }
  const dimensionConsistencia = useMemo(() => {
    if (!data?.dimensiones) return null
    return data.dimensiones.find((d) => d.dimension === "Consistencia") || null
  }, [data])

  const resumen = useMemo(() => {
    if (reglas.length === 0) return null

    const totalReglas = reglas.length
    const totalRegistros = reglas.reduce(
      (acc, regla) => acc + regla.totalRecords,
      0
    )
    const totalValidos = reglas.reduce(
      (acc, regla) => acc + regla.totalRegistrosValidos,
      0
    )
    const totalInvalidos = reglas.reduce(
      (acc, regla) => acc + regla.totalRegistrosInvalidos,
      0
    )
    const promedioValidez =
      reglas.reduce((acc, regla) => acc + regla.porcentajeRegistrosValidos, 0) /
      totalReglas
    const promedioInvalidez =
      reglas.reduce(
        (acc, regla) => acc + regla.porcentajeRegistrosInvalidos,
        0
      ) / totalReglas
    const reglasCriticas = reglas.filter(
      (regla) => regla.porcentajeRegistrosValidos < 85
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

  const topReglasConIncumplimientos = useMemo(() => {
    return reglas
      .slice()
      .sort((a, b) => b.totalRegistrosInvalidos - a.totalRegistrosInvalidos)
      .slice(0, 5)
      .map((regla) => ({
        regla: regla.ruleName || regla.regla,
        invalidos: regla.totalRegistrosInvalidos,
        porcentajeInvalido: Number(
          regla.porcentajeRegistrosInvalidos.toFixed(2)
        ),
        validos: regla.totalRegistrosValidos,
      }))
  }, [reglas])

  const tablaReglas = useMemo(
    () =>
      reglas
        .slice()
        .sort(
          (a, b) => a.porcentajeRegistrosValidos - b.porcentajeRegistrosValidos
        ),
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
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Promedio de inconsistencia
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
                {numberFormatter.format(resumen.totalValidos)}
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
                {numberFormatter.format(resumen.totalInvalidos)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <TablaProblemasCalidad
            dimension="Consistencia"
            data={dimensionConsistencia}
            onDownload={handleDownload}
            anio={anio}
            mes={mes}
          />
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
