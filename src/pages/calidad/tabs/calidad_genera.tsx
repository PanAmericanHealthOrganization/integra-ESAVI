import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material"
import { useMemo } from "react"
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts"

import { useCalidadDataQuality } from "../calidadDataQualityContext"
import { GraficoHistoricoCalidad } from "../components/GraficoHistoricoCalidad"

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

    const consistenciaGlobal =
      data.semanticQuality.length > 0
        ? data.semanticQuality.reduce(
            (acc, item) => acc + item.porcentajeRegistrosValidos,
            0
          ) / data.semanticQuality.length
        : null

    // Información de dimensiones desde la nueva estructura
    const dimensionesInfo =
      data.dimensiones?.map((dim) => ({
        nombre: dim.dimension,
        calidadTotal: dim.calidadTotal,
        deltaCalidadTotal: dim.deltaCalidadTotal,
        totalReglas: dim.jsonDimensionQuality.length,
      })) ?? []

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
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
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
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {title}
          </Typography>
          <Box sx={{ position: "relative", height: 220, mb: 2 }}>
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
                sx={{ mt: 0.5 }}>
                {status.label}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={status.label}
            color={status.chipColor}
            size="small"
            sx={{ mb: helperText ? 2 : 0 }}
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
    <Box sx={{ p: 3, bgcolor: "grey.50" }}>
      <Stack spacing={1.5} sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          Vista general de la calidad de datos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Resumen ejecutivo enfocado en las dimensiones de exactitud y
          consistencia. Última actualización: {ultimaActualizacion}.
        </Typography>
      </Stack>

      {resumenGlobal.dimensionesInfo &&
        resumenGlobal.dimensionesInfo.length > 0 && (
          <>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              Calidad por Dimensión
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {resumenGlobal.dimensionesInfo.map((dimension) => {
                const status = getScoreStatus(dimension.calidadTotal)
                const deltaPositivo = dimension.deltaCalidadTotal > 0
                const deltaNegativo = dimension.deltaCalidadTotal < 0

                return (
                  <Grid item xs={12} sm={6} md={4} key={dimension.nombre}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          {dimension.nombre}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 1,
                            mt: 1,
                          }}>
                          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                            {formatPercentage(dimension.calidadTotal)}
                          </Typography>
                          {dimension.deltaCalidadTotal !== 0 && (
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
                              {Math.abs(dimension.deltaCalidadTotal).toFixed(2)}
                              %
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={status.label}
                          color={status.chipColor}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ mt: 1 }}>
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

      {/* Gráfico Histórico de Calidad */}
      <Box sx={{ mb: 4 }}>
        <GraficoHistoricoCalidad />
      </Box>
    </Box>
  )
}
