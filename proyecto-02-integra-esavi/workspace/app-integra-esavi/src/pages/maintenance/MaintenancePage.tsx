import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  GlobalStyles,
} from '@mui/material'
import { RefreshRounded, BuildOutlined } from '@mui/icons-material'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../../theme'

interface MaintenancePageProps {
  status: 'loading' | 'error'
  lastChecked: Date | null
  onRetry: () => void
}

const fadeIn = `
  @keyframes mp-fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

/*
 * pageWrap: fija el contenedor al viewport completo,
 * impidiendo cualquier scroll en body/html.
 * El scroll solo puede ocurrir dentro del área de contenido.
 */
const pageWrap = {
  position: 'fixed' as const,
  inset: 0,                   // top/right/bottom/left = 0
  display: 'flex',
  flexDirection: 'column' as const,
  bgcolor: '#fafafb',
  overflow: 'hidden',         // el body nunca scrollea
}

/*
 * contentArea: ocupa el espacio restante bajo la AppBar,
 * centra la card y habilita scroll vertical solo aquí
 * cuando el contenido supera la altura disponible.
 */
const contentArea = {
  flex: 1,
  overflowY: 'auto' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  p: 3,
}

// ── Loading ────────────────────────────────────────────────────
const LoadingScreen = () => (
  <Box sx={pageWrap}>
    <LinearProgress sx={{ height: 3 }} />
    <Box sx={{ ...contentArea, flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Verificando disponibilidad del servicio…
      </Typography>
    </Box>
  </Box>
)

// ── Error / Maintenance ────────────────────────────────────────
const MaintenanceScreen = ({
  lastChecked,
  onRetry,
}: {
  lastChecked: Date | null
  onRetry: () => void
}) => {
  const checkedAt = lastChecked
    ? lastChecked.toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : null

  return (
    <Box sx={pageWrap}>
      {/* AppBar en flujo normal — no fixed — así no superpone el contenido */}
      <Box
        sx={{
          height: 48,
          flexShrink: 0,
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          px: 3,
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: '#fff', fontWeight: 500, fontSize: '0.875rem', opacity: 0.9 }}
        >
          Integra ESAVI
        </Typography>
      </Box>

      {/* Área de contenido — scroll solo aquí si la card no cabe */}
      <Box sx={contentArea}>
        <Card
          elevation={1}
          sx={{
            maxWidth: 400,
            width: '100%',
            animation: 'mp-fade-in 0.35s ease both',
          }}
        >
          <CardContent sx={{ p: '40px !important', textAlign: 'center' }}>
            {/* Icon */}
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <BuildOutlined sx={{ fontSize: 24, color: '#fff' }} />
            </Box>

            {/* Title */}
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}
            >
              Sistema no disponible
            </Typography>

            {/* Description */}
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', lineHeight: 1.75, mb: 3 }}
            >
              El servicio se encuentra en mantenimiento.
              Se restablecerá en breve.
            </Typography>

            {/* Last check */}
            {checkedAt && (
              <Typography
                variant="caption"
                display="block"
                sx={{ color: 'text.disabled', mb: 3 }}
              >
                Última verificación: {checkedAt}
              </Typography>
            )}

            {/* Retry */}
            <Button
              variant="contained"
              size="small"
              startIcon={<RefreshRounded />}
              onClick={onRetry}
              disableElevation
              sx={{ textTransform: 'none', px: 3 }}
            >
              Reintentar
            </Button>

            <Typography
              variant="caption"
              display="block"
              sx={{ color: 'text.disabled', mt: 2 }}
            >
              Reintento automático cada 30 s
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

// ── Public export ──────────────────────────────────────────────
export const MaintenancePage = ({ status, lastChecked, onRetry }: MaintenancePageProps) => (
  <ThemeProvider theme={theme}>
    <GlobalStyles styles={fadeIn} />
    {status === 'loading'
      ? <LoadingScreen />
      : <MaintenanceScreen lastChecked={lastChecked} onRetry={onRetry} />
    }
  </ThemeProvider>
)
