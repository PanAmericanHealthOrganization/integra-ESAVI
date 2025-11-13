import {
  Assessment,
  CheckCircle,
  Code,
  Psychology,
  Refresh,
  Schedule,
} from "@mui/icons-material"
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material"
import React, { useMemo, useState } from "react"

// Importar componentes de tabs
import CalidadCompletitud from "./tabs/calidad_completitud"
import { CalidadGeneral } from "./tabs/calidad_genera"
import CalidadSemantica from "./tabs/calidad_semantica"
import CalidadSintactica from "./tabs/calidad_sintactica"
import CalidadTemporal from "./tabs/calidad_temporal"
import {
  CalidadDataQualityProvider,
  useCalidadDataQuality,
} from "./calidadDataQualityContext"

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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
  const [currentTab, setCurrentTab] = useState(0)
  const { error, loading, refresh, selectedDate, setSelectedDate } =
    useCalidadDataQuality()

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  const tabs = useMemo(
    () => [
      {
        label: "General",
        icon: <Assessment />,
        component: <CalidadGeneral />,
      },
      {
        label: "Completitud",
        icon: <CheckCircle />,
        component: <CalidadCompletitud />,
      },
      {
        label: "Sintáctica",
        icon: <Code />,
        component: <CalidadSintactica />,
      },
      {
        label: "Semántica",
        icon: <Psychology />,
        component: <CalidadSemantica />,
      },
      {
        label: "Temporal",
        icon: <Schedule />,
        component: <CalidadTemporal />,
      },
    ],
    []
  )

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ width: "100%", overflow: "hidden" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            px: 3,
            py: 3,
          }}>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            Monitoreo de Calidad de Datos
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}>
            <TextField
              label="Fecha de referencia"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              sx={{ maxWidth: 220 }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<Refresh />}
              onClick={refresh}
              disabled={loading}>
              Actualizar
            </Button>
            {loading && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Cargando información…
                </Typography>
              </Stack>
            )}
          </Stack>

          {error && (
            <Alert severity="warning" sx={{ mb: 2 }}>
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
              "& .MuiTab-root": {
                minHeight: 72,
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
  )
}

export const CalidadDashList: React.FC = () => (
  <CalidadDataQualityProvider>
    <CalidadDashListContent />
  </CalidadDataQualityProvider>
)

export default CalidadDashList

export { CalidadDashListContent }
