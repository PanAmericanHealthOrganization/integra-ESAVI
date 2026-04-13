import { Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material"
import { useMemo } from "react"
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts"

import { useCalidadDataQuality } from "../calidadDataQualityContext"
import { GraficoHistoricoCalidad } from "../components/GraficoHistoricoCalidad"
import { GraficoTop10ProblemasCalidad } from "../components/GraficoTop10ProblemasCalidad"

const numberFormatter = new Intl.NumberFormat("es-ES")

type ScoreStatus = {
  label: string
  chipColor: "default" | "success" | "warning" | "error"
  gaugeColor: string
}

const getScoreStatus = (value: number | null): ScoreStatus => {
  if (value === null) {
    return { label: "Sin datos", chipColor: "default", gaugeColor: "#cbd5f5" }
  }

  if (value >= 95) {
    return { label: "Óptimo", chipColor: "success", gaugeColor: "#16a34a" }
  }

  if (value >= 85) {
    return {
      label: "En seguimiento",
      chipColor: "warning",
      gaugeColor: "#f59e0b",
    }
  }

  return { label: "Crítico", chipColor: "error", gaugeColor: "#dc2626" }
}

const formatPercentage = (value: number | null) =>
  value === null ? "Sin datos" : `${value.toFixed(2)}%`

const LoadingState = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: 300,
    }}>
    <Typography variant="h6">Cargando resumen general…</Typography>
  </Box>
)

const EmptyState = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: 300,
    }}>
    <Typography variant="h6">
      No hay datos de calidad disponibles para la fecha seleccionada.
    </Typography>
  </Box>
)

type ChartEmptyStateProps = { message: string }

const ChartEmptyState = ({ message }: ChartEmptyStateProps) => (
  <Box
    sx={{
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      px: 2,
      textAlign: "center",
    }}>
    <Typography variant="body1" color="text.secondary">
      {message}
    </Typography>
  </Box>
)

export const CalidadGeneral: React.FC = () => {
  const { data, loading, selectedDate } = useCalidadDataQuality()

  const resumenGlobal = useMemo(() => {
    if (!data) return null

    const exactitudGlobal =
      data.sintacticQuality.length > 0
        ? data.sintacticQuality.reduce(
            (acc, item) => acc + item.porcentajeRegistrosValidos,
            0
          ) / data.sintacticQuality.length
        : null

    // Información de dimensiones desde la nueva estructura
    const dimensionesInfo =
      data.dimensiones?.map((dim) => ({
        nombre: dim.dimension,
        calidadTotal: dim.calidadTotal,
        deltaCalidadTotal: dim.deltaCalidadTotal,
        totalReglas: dim.jsonDimensionQuality.length,
      })) ?? []

    // Buscar la dimensión de Consistencia en la nueva estructura
    const dimensionConsistencia = dimensionesInfo.find(
      (dim) => dim.nombre === "Consistencia"
    )

    const consistenciaGlobal = dimensionConsistencia
      ? dimensionConsistencia.calidadTotal
      : data.semanticQuality.length > 0
        ? data.semanticQuality.reduce(
            (acc, item) => acc + item.porcentajeRegistrosValidos,
            0
          ) / data.semanticQuality.length
        : null

    const deltaConsistenciaGlobal = dimensionConsistencia
      ? dimensionConsistencia.deltaCalidadTotal
      : 0

    const indicadoresDisponibles = [exactitudGlobal, consistenciaGlobal].filter(
      (value): value is number => value !== null
    )

    const indicadorCalidadGlobal =
      indicadoresDisponibles.length > 0
        ? indicadoresDisponibles.reduce((acc, value) => acc + value, 0) /
          indicadoresDisponibles.length
        : null

    const registrosSinErrores = Math.max(
      data.totalRegistros - data.totalErrores,
      0
    )

    const porcentajeRegistrosSinErrores =
      data.totalRegistros > 0
        ? (registrosSinErrores / data.totalRegistros) * 100
        : null

    const promedioCompletitud =
      data.completenessQualityTable.length > 0
        ? data.completenessQualityTable.reduce(
            (acc, item) => acc + item.completenessPercentage,
            0
          ) / data.completenessQualityTable.length
        : null

    return {
      indicadorCalidadGlobal,
      exactitudGlobal,
      consistenciaGlobal,
      deltaConsistenciaGlobal,
      porcentajeRegistrosSinErrores,
      registrosSinErrores,
      totalRegistros: data.totalRegistros,
      totalErrores: data.totalErrores,
      totalReglasExactitud: data.sintacticQuality.length,
      totalReglasConsistencia: data.semanticQuality.length,
      promedioCompletitud,
      dimensionesInfo,
    }
  }, [data])

  const ultimaActualizacion = useMemo(() => {
    if (!selectedDate) return "No disponible"
    const parsedDate = new Date(`${selectedDate}T00:00:00`)
    if (Number.isNaN(parsedDate.getTime())) return selectedDate
    return parsedDate.toLocaleDateString("es-SV", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }, [selectedDate])

  const summaryCards = useMemo(() => {
    if (!resumenGlobal) return []

    return [
      {
        title: "Indicador de calidad global",
        value: resumenGlobal.indicadorCalidadGlobal,
        helper: `Actualizado al ${ultimaActualizacion}`,
        status: getScoreStatus(resumenGlobal.indicadorCalidadGlobal),
      },
      {
        title: "Exactitud global",
        value: resumenGlobal.exactitudGlobal,
        helper: `Basado en ${resumenGlobal.totalReglasExactitud} reglas de exactitud`,
        status: getScoreStatus(resumenGlobal.exactitudGlobal),
      },
      {
        title: "Consistencia global",
        value: resumenGlobal.consistenciaGlobal,
        helper: `Basado en ${resumenGlobal.totalReglasConsistencia} reglas de consistencia`,
        status: getScoreStatus(resumenGlobal.consistenciaGlobal),
      },
      {
        title: "% de registros sin errores",
        value: resumenGlobal.porcentajeRegistrosSinErrores,
        helper: `${numberFormatter.format(
          resumenGlobal.registrosSinErrores
        )} de ${numberFormatter.format(
          resumenGlobal.totalRegistros
        )} registros`,
        status: getScoreStatus(resumenGlobal.porcentajeRegistrosSinErrores),
      },
    ]
  }, [resumenGlobal, ultimaActualizacion])

  const GaugeCard = ({
    title,
    value,
    helperText,
  }: {
    title: string
    value: number | null
    helperText?: string
  }) => {
    const status = getScoreStatus(value)

    if (value === null) {
      return (
        <Card sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.375 }}>
              {title}
            </Typography>
            <ChartEmptyState message="No se recibieron datos para calcular esta métrica." />
          </CardContent>
        </Card>
      )
    }

    const clampedValue = Math.max(0, Math.min(100, value))

    return (
      <Card sx={{ height: "100%" }}>
        <CardContent sx={{ height: "100%" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.375 }}>
            {title}
          </Typography>
          <Box sx={{ position: "relative", height: 220, mb: 0.375 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={[{ name: title, value: clampedValue }]}
                innerRadius="65%"
                outerRadius="100%"
                startAngle={180}
                endAngle={0}>
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  tick={false}
                  angleAxisId={0}
                />
                <RadialBar
                  dataKey="value"
                  fill={status.gaugeColor}
                  cornerRadius={16}
                  background={{ fill: "#e5e7eb" }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -10%)",
                textAlign: "center",
              }}>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {clampedValue.toFixed(1)}%
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.375 }}>
                {status.label}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={status.label}
            color={status.chipColor}
            size="small"
            sx={{ mb: helperText ? 0.375 : 0 }}
          />
          {helperText && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block">
              {helperText}
            </Typography>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <LoadingState />
  }

  if (!data || !resumenGlobal) {
    return <EmptyState />
  }

  return (
    <Box sx={{ p: 0.375, bgcolor: "grey.50" }}>
      {resumenGlobal.dimensionesInfo &&
        resumenGlobal.dimensionesInfo.length > 0 && (
          <>
            <Grid container spacing={0.375} sx={{ mb: 0.375 }}>
              {resumenGlobal.dimensionesInfo.map((dimension) => {
                const status = getScoreStatus(dimension.calidadTotal)
                const deltaCalidad = dimension.deltaCalidadTotal ?? 0
                const deltaPositivo = deltaCalidad > 0
                const deltaNegativo = deltaCalidad < 0
                const tieneDelta = deltaCalidad !== 0

                return (
                  <Grid item xs={12} sm={6} md={4} key={dimension.nombre}>
                    <Card sx={{ height: "100%" }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          {dimension.nombre}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 0.375,
                            mt: 0.375,
                          }}>
                          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                            {formatPercentage(dimension.calidadTotal)}
                          </Typography>
                          {tieneDelta && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: deltaPositivo
                                  ? "success.main"
                                  : deltaNegativo
                                    ? "error.main"
                                    : "text.secondary",
                                fontWeight: 600,
                              }}>
                              {deltaPositivo ? "↑" : "↓"}{" "}
                              {Math.abs(deltaCalidad).toFixed(2)}%
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={status.label}
                          color={status.chipColor}
                          size="small"
                          sx={{ mt: 0.375 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 0.375 }}>
                          {dimension.totalReglas} reglas evaluadas
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          </>
        )}

      {/* Gráficos de Calidad */}
      <Grid container spacing={0.375} sx={{ mb: 0.375 }}>
        <Grid item xs={12} md={6}>
          <GraficoHistoricoCalidad />
        </Grid>
        <Grid item xs={12} md={6}>
          <GraficoTop10ProblemasCalidad />
        </Grid>
      </Grid>
    </Box>
  )
}
