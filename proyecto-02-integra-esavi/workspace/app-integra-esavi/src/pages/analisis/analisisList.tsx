import { useEffect, useState } from "react"
import { Box, Grid, Alert, CircularProgress } from "@mui/material"
import { Bar, Pie } from "react-chartjs-2"
import { dashboardDataProvider } from "../../dataProviders/dashboard.dataprovider"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const AnalisisList = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [iframeKey, setIframeKey] = useState(0)
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)

  // Función para validar la URL del iframe
  const validateIframeUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)

      // En desarrollo, permitir HTTP y HTTPS
      const isDevelopment = import.meta.env.DEV

      if (!isDevelopment) {
        // En producción, solo permitir HTTPS
        if (urlObj.protocol !== "https:") {
          return false
        }
      } else {
        // En desarrollo, permitir HTTP y HTTPS
        if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
          return false
        }
      }

      // En desarrollo, permitir dominios locales y ngrok
      if (isDevelopment) {
        const localDomains = [
          "localhost",
          "127.0.0.1",
          "ngrok.io",
          "ngrok.app",
          "ngrok-free.app",
          "tu-dominio-permitido.com",
          "otro-dominio-permitido.com",
        ]
        return localDomains.some((domain) => urlObj.hostname.includes(domain))
      } else {
        // En producción, solo dominios permitidos
        const allowedDomains = [
          "tu-dominio-permitido.com",
          "otro-dominio-permitido.com",
        ]
        return allowedDomains.some((domain) => urlObj.hostname.includes(domain))
      }
    } catch {
      return false
    }
  }

  // Función para obtener el token de Keycloak y pasarlo al iframe
  const getIframeUrlWithAuth = () => {
    const baseUrl = import.meta.env.VITE_DATA_ANALISIS_URL
    if (!baseUrl) {
      setError("URL de análisis no configurada")
      return null
    }

    if (!validateIframeUrl(baseUrl)) {
      setError("URL de análisis no válida o no permitida")
      return null
    }

    // Obtener el token de Keycloak del localStorage o del contexto de autenticación
    const token =
      localStorage.getItem("keycloak-token") ||
      sessionStorage.getItem("keycloak-token")

    if (token) {
      // Agregar el token como parámetro de consulta o en el header
      const separator = baseUrl.includes("?") ? "&" : "?"
      return `${baseUrl}${separator}token=${encodeURIComponent(token)}`
    }

    return baseUrl
  }

  // useEffect para manejar la inicialización del iframe
  useEffect(() => {
    const url = getIframeUrlWithAuth()
    setIframeUrl(url)
  }, []) // Solo se ejecuta una vez al montar el componente

  const handleIframeLoad = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setError("Error al cargar el contenido del análisis")
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box
            sx={{
              width: "100%",
              height: "80vh",
              border: "1px solid #ccc",
              position: "relative",
            }}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  right: 10,
                  zIndex: 1,
                }}>
                {error}
              </Alert>
            )}

            {isLoading && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1,
                }}>
                <CircularProgress />
              </Box>
            )}

            {iframeUrl && (
              <iframe
                key={iframeKey}
                src={iframeUrl}
                title="Análisis de Datos"
                width="100%"
                height="100%"
                style={{ border: "none" }}
                // Consideraciones de seguridad
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                // Prevenir acceso a la ventana padre
                allow="fullscreen"
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AnalisisList
