import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
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

    // Separar reglas por subdimensión
    const reglasDominio = reglas.filter(
      (regla) => regla.subDimension === "Dominio"
    )
    const reglasIntrarelacion = reglas.filter(
      (regla) => regla.subDimension === "Intrarelación"
    )
    const reglasInterrelacion = reglas.filter(
      (regla) => regla.subDimension === "Interrelación"
    )

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
    const promedioInvalidez = Math.min(
      100,
      Math.max(
        0,
        reglas.reduce(
          (acc, regla) => acc + regla.porcentajeRegistrosInvalidos,
          0
        ) / totalReglas
      )
    )
    const reglasCriticas = reglas.filter(
      (regla) => regla.porcentajeRegistrosValidos < 85
    ).length

    // Calcular promedios por subdimensión
    const promedioDominio =
      reglasDominio.length > 0
        ? reglasDominio.reduce(
            (acc, regla) => acc + regla.porcentajeRegistrosValidos,
            0
          ) / reglasDominio.length
        : 0

    const promedioIntrarelacion =
      reglasIntrarelacion.length > 0
        ? reglasIntrarelacion.reduce(
            (acc, regla) => acc + regla.porcentajeRegistrosValidos,
            0
          ) / reglasIntrarelacion.length
        : 0

    const promedioInterrelacion =
      reglasInterrelacion.length > 0
        ? reglasInterrelacion.reduce(
            (acc, regla) => acc + regla.porcentajeRegistrosValidos,
            0
          ) / reglasInterrelacion.length
        : 0

    return {
      totalReglas,
      totalRegistros,
      totalValidos,
      totalInvalidos,
      promedioValidez,
      promedioInvalidez,
      reglasCriticas,
      promedioDominio,
      promedioIntrarelacion,
      promedioInterrelacion,
      totalReglasDominio: reglasDominio.length,
      totalReglasIntrarelacion: reglasIntrarelacion.length,
      totalReglasInterrelacion: reglasInterrelacion.length,
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
    <Box sx={{ p: 0.375 }}>
      <Grid container spacing={0.375} sx={{ mb: 0.375 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Reglas evaluadas
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold", mt: 0.375 }}>
                {resumen.totalReglas}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Promedio dominio
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.375,
                  mt: 0.375,
                }}>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {resumen.promedioDominio.toFixed(2)}%
                </Typography>
                <Chip
                  label={getStatusLabel(resumen.promedioDominio)}
                  color={getStatusColor(resumen.promedioDominio) as any}
                  size="small"
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 0.375 }}>
                {resumen.totalReglasDominio} reglas de dominio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Promedio intrarelación
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.375,
                  mt: 0.375,
                }}>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {resumen.promedioIntrarelacion.toFixed(2)}%
                </Typography>
                <Chip
                  label={getStatusLabel(resumen.promedioIntrarelacion)}
                  color={getStatusColor(resumen.promedioIntrarelacion) as any}
                  size="small"
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 0.375 }}>
                {resumen.totalReglasIntrarelacion} reglas de intrarelación
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Promedio interrelación
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.375,
                  mt: 0.375,
                }}>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {resumen.promedioInterrelacion.toFixed(2)}%
                </Typography>
                <Chip
                  label={getStatusLabel(resumen.promedioInterrelacion)}
                  color={getStatusColor(resumen.promedioInterrelacion) as any}
                  size="small"
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 0.375 }}>
                {resumen.totalReglasInterrelacion} reglas de interrelación
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Promedio de inconsistencia
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.375,
                  mt: 0.375,
                }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: "error.main" }}>
                  {resumen.promedioInvalidez.toFixed(2)}%
                </Typography>
                <Chip label="Crítico" color="error" size="small" />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 0.375 }}>
                {resumen.reglasCriticas} reglas críticas
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

      <Alert severity="info" sx={{ mt: 0.375 }}>
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
