import { CheckCircle, ErrorOutline, Warning } from "@mui/icons-material"
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
  const { data, loading, selectedDate } = useCalidadDataQuality()
  const reglas = data?.sintacticQuality ?? []

  // Extraer año y mes de la fecha seleccionada
  const anio = selectedDate ? parseInt(selectedDate.split("-")[0]) : undefined
  const mes = selectedDate ? parseInt(selectedDate.split("-")[1]) : undefined

  // Función de descarga (placeholder)
  const handleDownload = (codigo: string, anio: number, mes: number) => {
    console.log("Descargar datos para:", { codigo, anio, mes })
    // TODO: Implementar lógica de descarga
  }

  // Buscar la dimensión de exactitud en las dimensiones disponibles
  const dimensionExactitud = useMemo(() => {
    if (!data?.dimensiones) return null
    return data.dimensiones.find((d) => d.dimension === "Exactitud") || null
  }, [data])

  const resumen = useMemo(() => {
    if (reglas.length === 0) {
      return null
    }

    // Separar reglas sintácticas y semánticas
    const reglasSintacticas = reglas.filter(
      (item) => item.subDimension === "Sintáctica"
    )
    const reglasSemanticas = reglas.filter(
      (item) => item.subDimension === "Semántica"
    )

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

    // Calcular promedios específicos
    const promedioSintactico =
      reglasSintacticas.length > 0
        ? reglasSintacticas.reduce(
            (acc, item) => acc + item.porcentajeRegistrosValidos,
            0
          ) / reglasSintacticas.length
        : 0

    const promedioSemantico =
      reglasSemanticas.length > 0
        ? reglasSemanticas.reduce(
            (acc, item) => acc + item.porcentajeRegistrosValidos,
            0
          ) / reglasSemanticas.length
        : 0

    return {
      totalReglas,
      totalRegistros,
      totalValidos,
      totalInvalidos,
      promedioValidez,
      promedioInvalidez,
      reglasCriticas,
      promedioSintactico,
      promedioSemantico,
      totalReglasSintacticas: reglasSintacticas.length,
      totalReglasSemanticas: reglasSemanticas.length,
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
    return <ErrorOutline color="error" />
  }

  if (loading) {
    return <LoadingState />
  }

  if (!resumen) {
    return <EmptyState />
  }

  return (
    <Box sx={{ p: 0.375 }}>
      <Grid container spacing={0.375} sx={{ mb: 0.375 }}>
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Promedio semántico
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {resumen.promedioSemantico.toFixed(2)}%
                </Typography>
                <Chip
                  label={getStatusLabel(resumen.promedioSemantico)}
                  color={getStatusColor(resumen.promedioSemantico) as any}
                  size="small"
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 0.375 }}>
                {resumen.totalReglasSemanticas} reglas semánticas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Promedio sintáctico
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  {resumen.promedioSintactico.toFixed(2)}%
                </Typography>
                <Chip
                  label={getStatusLabel(resumen.promedioSintactico)}
                  color={getStatusColor(resumen.promedioSintactico) as any}
                  size="small"
                />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 0.375 }}>
                {resumen.totalReglasSintacticas} reglas sintácticas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        Promedio de consistencia
      </Grid>

      <Grid container spacing={0.375}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TablaProblemasCalidad
                dimension="Exactitud"
                data={dimensionExactitud}
                onDownload={handleDownload}
                anio={anio}
                mes={mes}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 0.375 }}>
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
