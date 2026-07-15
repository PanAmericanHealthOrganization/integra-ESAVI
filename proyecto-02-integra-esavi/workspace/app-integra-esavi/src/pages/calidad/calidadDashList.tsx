import {
  Assessment,
  CheckCircle,
  FactCheck,
  Psychology,
  Refresh,
} from "@mui/icons-material"
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import { alpha, useTheme } from "@mui/material/styles"
import React, { useEffect, useMemo, useState } from "react"

// Importar componentes de tabs
import {
  CalidadDataQualityProvider,
  useCalidadDataQuality,
} from "./calidadDataQualityContext"
import { CalidadNavigationProvider } from "./contexts/CalidadNavigationContext"
import RecalcularCalidad from "./components/RecalcularCalidad"
import { MesUtils } from "./utils/mesUtils"
import CalidadCompletitud from "./tabs/calidad_completitud"
import { CalidadGeneral } from "./tabs/calidad_genera"
import CalidadSemantica from "./tabs/calidad_semantica"
import CalidadSintactica from "./tabs/calidad_sintactica"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`calidad-tabpanel-${index}`}
      aria-labelledby={`calidad-tab-${index}`}
      {...other}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `calidad-tab-${index}`,
    "aria-controls": `calidad-tabpanel-${index}`,
  }
}

const CalidadDashListContent: React.FC = () => {
  const theme = useTheme()
  const [currentTab, setCurrentTab] = useState(0)
  const { error, loading, refresh, selectedDate, setSelectedDate } =
    useCalidadDataQuality()

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  // Mapeo de dimensiones a índices de tabs
  const dimensionToTabIndex: Record<string, number> = {
    General: 0,
    Exactitud: 1,
    Consistencia: 2,
    Completitud: 3,
  }

  const handleNavigateToTab = (dimension: string) => {
    const tabIndex = dimensionToTabIndex[dimension]
    if (tabIndex !== undefined) {
      setCurrentTab(tabIndex)
    }
  }

  // Navegación por teclado entre meses:
  // ← mes anterior · → mes siguiente · ↑/↓ mes actual
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const tag = target.tagName
      const esCampoFormulario =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      // No interferir al escribir en formularios, salvo en el propio
      // campo de fecha de referencia
      if (esCampoFormulario && target.id !== "fecha-referencia-calidad") return
      // No interferir cuando hay un diálogo abierto (p. ej. Recalcular)
      if (target.closest(".MuiDialog-root")) return

      const cambiarMes = (nuevoMes: string) => {
        event.preventDefault()
        setSelectedDate(
          MesUtils.limitar(nuevoMes, MesUtils.mesMinimo(), MesUtils.mesActual())
        )
      }

      switch (event.key) {
        case "ArrowLeft":
          cambiarMes(MesUtils.sumarMeses(selectedDate, -1))
          break
        case "ArrowRight":
          cambiarMes(MesUtils.sumarMeses(selectedDate, 1))
          break
        case "ArrowUp":
        case "ArrowDown":
          cambiarMes(MesUtils.mesActual())
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedDate, setSelectedDate])

  const tabs = useMemo(
    () => [
      {
        label: "General",
        icon: <Assessment />,
        component: <CalidadGeneral />,
      },
      {
        label: "Exactitud",
        icon: <CheckCircle />,
        component: <CalidadSintactica />,
      },
      {
        label: "Consistencia",
        icon: <Psychology />,
        component: <CalidadSemantica />,
      },
      {
        label: "Completitud",
        icon: <FactCheck />,
        component: <CalidadCompletitud />,
      },
    ],
    []
  )

  return (
    <CalidadNavigationProvider onNavigateToTab={handleNavigateToTab}>
      <Container maxWidth="xl" sx={{ py: 1 }}>
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            overflow: "hidden",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
            }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
                px: 2.5,
                py: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              }}>
              <Box display="flex" alignItems="center" gap={1.5} sx={{ flexShrink: 0 }}>
                <Avatar sx={{ bgcolor: "primary.main", width: 38, height: 38 }}>
                  <Assessment fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                    Monitoreo de Calidad de Datos
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Evaluación de reglas de calidad por dimensión
                  </Typography>
                </Box>
              </Box>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flexShrink: 1 }}>
                {loading && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      Cargando…
                    </Typography>
                  </Stack>
                )}
                <TextField
                  label="Fecha de referencia"
                  type="month"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={selectedDate}
                  onChange={(event) => {
                    const selectedValue = event.target.value
                    setSelectedDate(selectedValue)
                  }}
                  inputProps={{
                    id: "fecha-referencia-calidad",
                    min: MesUtils.mesMinimo(),
                    max: MesUtils.mesActual(),
                  }}
                  sx={{ minWidth: 180, bgcolor: "background.paper" }}
                />
                <Tooltip title="Actualizar datos">
                  <span>
                    <IconButton
                      color="primary"
                      onClick={refresh}
                      disabled={loading}>
                      <Refresh />
                    </IconButton>
                  </span>
                </Tooltip>
                <RecalcularCalidad />
              </Stack>
            </Box>

            {error && (
              <Alert severity="warning" sx={{ mx: 2.5, my: 1 }}>
                {error}
              </Alert>
            )}
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              aria-label="calidad dashboard tabs"
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 48,
                "& .MuiTab-root": {
                  minHeight: 48,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 500,
                },
                px: 3,
              }}>
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  iconPosition="start"
                  label={tab.label}
                  {...a11yProps(index)}
                />
              ))}
            </Tabs>
          </Box>

          {tabs.map((tab, index) => (
            <TabPanel key={index} value={currentTab} index={index}>
              {tab.component}
            </TabPanel>
          ))}
        </Paper>
      </Container>
    </CalidadNavigationProvider>
  )
}

export const CalidadDashList: React.FC = () => (
  <CalidadDataQualityProvider>
    <CalidadDashListContent />
  </CalidadDataQualityProvider>
)

export default CalidadDashList

export { CalidadDashListContent }
