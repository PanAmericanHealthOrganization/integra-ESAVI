import { Alert, Box, Typography } from "@mui/material"

import { useCalidadDataQuality } from "../calidadDataQualityContext"

const LoadingState = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: 240,
    }}>
    <Typography variant="h6">
      Cargando métricas temporales…
    </Typography>
  </Box>
)

const EmptyState = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: 240,
      textAlign: "center",
      px: 3,
    }}>
    <Typography variant="body1" color="text.secondary">
      El servicio de calidad de datos no reportó métricas temporales para la
      fecha consultada. Una vez que existan indicadores (latencia,
      frecuencia de actualización o tendencias), se mostrarán en este módulo.
    </Typography>
  </Box>
)

const CalidadTemporal: React.FC = () => {
  const { data, loading } = useCalidadDataQuality()
  const temporalQuality = data?.temporalQuality ?? []

  if (loading) {
    return <LoadingState />
  }

  if (temporalQuality.length === 0) {
    return (
      <Box sx={{ p: 0.375 }}>
        <EmptyState />
        <Alert severity="info">
          <Typography variant="body2">
            Asegúrese de que el backend exponga indicadores temporales para
            habilitar los gráficos relacionados con latencias y frecuencias de
            carga.
          </Typography>
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 0.375 }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 0.375 }}>
        Métricas temporales disponibles
      </Typography>
      <Alert severity="info">
        <Typography variant="body2">
          Se recibieron {temporalQuality.length} registros de métricas
          temporales. Adapte este componente para visualizarlos según la
          estructura entregada por el servicio.
        </Typography>
      </Alert>
    </Box>
  )
}

export default CalidadTemporal
