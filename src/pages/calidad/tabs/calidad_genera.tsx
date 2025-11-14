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
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useCalidadDataQuality } from "../calidadDataQualityContext"

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
            (acc, item) => acc + item.percentageValidRecords,
            0
          ) / data.semanticQuality.length
        : null

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
    }
  }, [data])

  const resumenCompletitud = useMemo(() => {
    if (!data || data.completenessQualityTable.length === 0) return null

    const totalCampos = data.completenessQualityTable.length
    const promedioCompletitud =
      data.completenessQualityTable.reduce(
        (acc, item) => acc + item.completenessPercentage,
        0
      ) / totalCampos

    const camposCompletos = data.completenessQualityTable.filter(
      (item) => item.completenessPercentage === 100
    ).length

    const camposCriticos = data.completenessQualityTable.filter(
      (item) => item.completenessPercentage < 50
    ).length

    const columnasCeroRegistros = data.completenessQualityTable.filter(
      (item) => item.totalRecords === 0
    ).length

    return {
      totalCampos,
      promedioCompletitud,
      camposCompletos,
      camposCriticos,
      columnasCeroRegistros,
    }
  }, [data])

  const topCamposIncompletos = useMemo(() => {
    if (!data) return []

    return [...data.completenessQualityTable]
      .sort(
        (a, b) =>
          a.completenessPercentage - b.completenessPercentage ||
          b.totalRecords - a.totalRecords
      )
      .slice(0, 10)
      .map((item) => ({
        nombre: `${item.tableName}.${item.columnName}`,
        completitud: Number(item.completenessPercentage.toFixed(2)),
        faltante: Number((100 - item.completenessPercentage).toFixed(2)),
      }))
  }, [data])

  const tendenciaTemporal = useMemo(() => {
    if (!data || data.temporalQuality.length === 0) return []

    return data.temporalQuality
      .map((item) => {
        const registro = item as Record<string, unknown>

        const periodo =
          (typeof registro.period === "string" && registro.period) ||
          (typeof registro.periodo === "string" && registro.periodo) ||
          (typeof registro.fecha === "string" && registro.fecha) ||
          (typeof registro.month === "string" && registro.month) ||
          (typeof registro.fechaCorte === "string" && registro.fechaCorte) ||
          null

        const indicador =
          (typeof registro.indicadorCalidadGlobal === "number" &&
            registro.indicadorCalidadGlobal) ||
          (typeof registro.qualityScore === "number" &&
            registro.qualityScore) ||
          (typeof registro.totalScore === "number" && registro.totalScore) ||
          (typeof registro.calidadGlobal === "number" &&
            registro.calidadGlobal) ||
          null

        const exactitud =
          (typeof registro.exactitudGlobal === "number" &&
            registro.exactitudGlobal) ||
          (typeof registro.accuracy === "number" && registro.accuracy) ||
          null

        const consistencia =
          (typeof registro.consistenciaGlobal === "number" &&
            registro.consistenciaGlobal) ||
          (typeof registro.consistency === "number" && registro.consistency) ||
          null

        if (!periodo || indicador === null) return null

        return {
          periodo,
          indicador: indicador as number,
          exactitud: exactitud as number | null,
          consistencia: consistencia as number | null,
        }
      })
      .filter(
        (
          item
        ): item is {
          periodo: string
          indicador: number
          exactitud: number | null
          consistencia: number | null
        } => item !== null
      )
  }, [data])

  const columnasConMasNulos = useMemo(() => {
    if (!data) return []

    return data.completenessQualityTable
      .filter((row) => row.totalNulls > 0)
      .sort((a, b) => b.totalNulls - a.totalNulls)
      .slice(0, 8)
      .map((row) => ({
        columna: `${row.tableName}.${row.columnName}`,
        nulos: row.totalNulls,
        noNulos: row.totalNonNulls,
      }))
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

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((metric) => (
          <Grid item xs={12} sm={6} md={3} key={metric.title}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {metric.title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                  {formatPercentage(metric.value)}
                </Typography>
                <Chip
                  label={metric.status.label}
                  color={metric.status.chipColor}
                  size="small"
                  sx={{ mt: 1 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ mt: 1 }}>
                  {metric.helper}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <GaugeCard
            title="Semáforo de calidad global"
            value={resumenGlobal.indicadorCalidadGlobal}
            helperText="Objetivo recomendado: ≥ 95% (verde); seguimiento entre 85% y 94% (amarillo)."
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ height: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Tendencia temporal de calidad
              </Typography>
              <Box sx={{ height: 240 }}>
                {tendenciaTemporal.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tendenciaTemporal}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        formatter={(value: number) => `${value.toFixed(2)}%`}
                        labelFormatter={(label) => `Período: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="indicador"
                        name="Indicador global"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot
                        activeDot={{ r: 6 }}
                      />
                      {tendenciaTemporal.some(
                        (item) => item.exactitud !== null
                      ) && (
                        <Line
                          type="monotone"
                          dataKey="exactitud"
                          name="Exactitud"
                          stroke="#16a34a"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {tendenciaTemporal.some(
                        (item) => item.consistencia !== null
                      ) && (
                        <Line
                          type="monotone"
                          dataKey="consistencia"
                          name="Consistencia"
                          stroke="#f97316"
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmptyState message="El servicio aún no entrega una serie temporal para mostrar la evolución mensual de los indicadores. Solicite al backend los valores históricos para habilitar esta vista." />
                )}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 2 }}>
                Los valores se calculan a partir de los resultados históricos
                provistos por el servicio de calidad de datos.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Top 10 columnas con menor completitud
              </Typography>
              <Box sx={{ height: 320 }}>
                {topCamposIncompletos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCamposIncompletos} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis type="category" dataKey="nombre" width={240} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Completitud"]}
                      />
                      <Legend />
                      <Bar
                        dataKey="completitud"
                        name="Completitud"
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar
                        dataKey="faltante"
                        name="Dato faltante"
                        fill="#ef4444"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmptyState message="Todas las columnas presentan 100% de completitud." />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Resumen de completitud
              </Typography>
              {resumenCompletitud ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Promedio global
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                      {resumenCompletitud.promedioCompletitud.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Columnas evaluadas
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                      {numberFormatter.format(resumenCompletitud.totalCampos)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Columnas completas
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {numberFormatter.format(
                          resumenCompletitud.camposCompletos
                        )}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Columnas críticas
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {numberFormatter.format(
                          resumenCompletitud.camposCriticos
                        )}
                      </Typography>
                    </Box>
                  </Stack>
                  {resumenCompletitud.columnasCeroRegistros > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {numberFormatter.format(
                        resumenCompletitud.columnasCeroRegistros
                      )}{" "}
                      columnas no reportaron registros durante el período.
                    </Typography>
                  )}
                </Stack>
              ) : (
                <ChartEmptyState message="No se encontraron columnas evaluadas para calcular el resumen de completitud." />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Columnas con mayor número de valores nulos
              </Typography>
              <Box sx={{ height: 360 }}>
                {columnasConMasNulos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={columnasConMasNulos} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="columna" width={260} />
                      <Tooltip
                        formatter={(value) => [
                          numberFormatter.format(value as number),
                          "",
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="nulos"
                        name="Valores nulos"
                        fill="#ef4444"
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar
                        dataKey="noNulos"
                        name="Valores completos"
                        fill="#10b981"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartEmptyState message="No se encontraron columnas con valores nulos para la fecha seleccionada." />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
