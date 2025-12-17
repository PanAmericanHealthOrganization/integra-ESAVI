import WarningIcon from "@mui/icons-material/Warning"
import { Box, Paper, Typography } from "@mui/material"
import { useEffect, useRef, useState } from "react"
import ENV_CONFIG from "../../utils/env_utils"

export const EsaviDashboardList = () => {
  const token = ENV_CONFIG.INT_ESAVI_DASHBOARD_TOKEN
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Timeout de 3 segundos para detectar si el servidor no responde
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setIsError(true)
        setIsLoading(false)
      }
    }, 3000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isLoading])

  const handleIframeError = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsError(true)
    setIsLoading(false)
  }

  const handleIframeLoad = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsLoading(false)
  }

  // Verificar si la URL está disponible
  if (!ENV_CONFIG.VITE_DATA_ANALISIS_URL || !token) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh">
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            textAlign: "center",
            maxWidth: 600,
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
          }}>
          <WarningIcon
            sx={{ fontSize: 60, color: "#ff9800", marginBottom: 2 }}
          />
          <Typography variant="h5" gutterBottom color="text.primary">
            Página en Mantenimiento
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Esta página no está disponible en este momento. Por favor, consulte
            con el administrador del sistema.
          </Typography>
        </Paper>
      </Box>
    )
  }

  if (isError) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh">
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            textAlign: "center",
            maxWidth: 600,
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
          }}>
          <WarningIcon
            sx={{ fontSize: 60, color: "#ff9800", marginBottom: 2 }}
          />
          <Typography variant="h5" gutterBottom color="text.primary">
            Página en Mantenimiento
          </Typography>
          <Typography variant="body1" color="text.secondary">
            No se pudo cargar el dashboard. Por favor, consulte con el
            administrador del sistema.
          </Typography>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ width: "100%", height: "96%", position: "relative" }}>
      {isLoading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="80vh"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "white",
            zIndex: 1000,
          }}>
          <Typography variant="body1">Cargando dashboard...</Typography>
        </Box>
      )}
      <iframe
        src={`${ENV_CONFIG.VITE_DATA_ANALISIS_URL}?token=${token}`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        onError={handleIframeError}
        onLoad={handleIframeLoad}
      />
    </Box>
  )
}
