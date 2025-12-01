import { Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material"
import { useEffect, useMemo, useState } from "react"

import { useCalidadDataQuality } from "../calidadDataQualityContext"
import { TablaProblemasCalidad } from "../components/TablaProblemasCalidad"

const numberFormatter = new Intl.NumberFormat("es-ES")

const getStatusColor = (percentage: number) => {
  if (percentage >= 95) return "success"
  if (percentage >= 75) return "warning"
  return "error"
}

const getStatusLabel = (percentage: number) => {
  if (percentage >= 95) return "Óptimo"
  if (percentage >= 75) return "Aceptable"
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
    <Typography variant="h6">Cargando datos de completitud…</Typography>
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
      No hay información de completitud disponible para la fecha seleccionada.
    </Typography>
  </Box>
)

const CalidadCompletitud: React.FC = () => {
  const { data, loading, refresh, selectedDate } = useCalidadDataQuality()
  const [selectedTable, setSelectedTable] = useState<string>("")
  // Función de descarga (placeholder)
  const handleDownload = (codigo: string, anio: number, mes: number) => {
    console.log("Descargar datos para:", { codigo, anio, mes })
    // TODO: Implementar lógica de descarga
  } // Extraer año y mes de la fecha seleccionada
  const anio = selectedDate ? parseInt(selectedDate.split("-")[0]) : undefined
  const mes = selectedDate ? parseInt(selectedDate.split("-")[1]) : undefined

  const dimensionCompletitud = useMemo(() => {
    if (!data?.dimensiones) return null
    return data.dimensiones.find((d) => d.dimension === "Completitud") || null
  }, [data])

  const tablasDisponibles = useMemo(() => {
    if (!data) return []
    return Array.from(
      new Set(data.completenessQualityTable.map((row) => row.tableName))
    ).sort()
  }, [data])

  useEffect(() => {
    if (!selectedTable && tablasDisponibles.length > 0) {
      setSelectedTable(tablasDisponibles[0])
    }
  }, [selectedTable, tablasDisponibles])

  const columnasTabla = useMemo(() => {
    if (!data || !selectedTable) return []
    return data.completenessQualityTable.filter(
      (row) => row.tableName === selectedTable
    )
  }, [data, selectedTable])

  const resumenTabla = useMemo(() => {
    if (columnasTabla.length === 0) return null

    const totalColumnas = columnasTabla.length
    const promedio =
      columnasTabla.reduce(
        (acc, item) => acc + item.completenessPercentage,
        0
      ) / totalColumnas

    const totalRegistros = columnasTabla.reduce(
      (acc, item) => acc + item.totalRecords,
      0
    )

    const totalNulls = columnasTabla.reduce(
      (acc, item) => acc + item.totalNulls,
      0
    )

    const totalNonNulls = columnasTabla.reduce(
      (acc, item) => acc + item.totalNonNulls,
      0
    )

    const columnasCriticas = columnasTabla.filter(
      (item) => item.completenessPercentage < 50
    ).length

    return {
      totalColumnas,
      promedio,
      totalRegistros,
      totalNulls,
      totalNonNulls,
      columnasCriticas,
    }
  }, [columnasTabla])

  if (loading) {
    return <LoadingState />
  }

  if (!data) {
    return <EmptyState />
  }

  const promedioTabla = resumenTabla?.promedio ?? 0
  const columnasCriticas = resumenTabla?.columnasCriticas ?? 0
  const totalNonNulls = resumenTabla?.totalNonNulls ?? 0
  const totalColumnas = resumenTabla?.totalColumnas ?? 0

  return (
    <Box sx={{ p: 3 }}>
      {columnasTabla.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Columnas evaluadas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                    {numberFormatter.format(totalColumnas)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Promedio de completitud
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                    {promedioTabla.toFixed(2)}%
                  </Typography>
                  <Chip
                    label={getStatusLabel(promedioTabla)}
                    color={getStatusColor(promedioTabla) as any}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Registros con datos
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold", mt: 1 }}>
                    {numberFormatter.format(totalNonNulls)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sin valores nulos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Detalle de completitud por columna
              </Typography>
              <TablaProblemasCalidad
                dimension="Completitud"
                data={dimensionCompletitud}
                onDownload={handleDownload}
                anio={anio}
                mes={mes}
              />
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}

export default CalidadCompletitud
