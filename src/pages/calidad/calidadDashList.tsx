import {
  Assessment,
  CheckCircle,
  Psychology,
  Refresh,
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
import {
  CalidadDataQualityProvider,
  useCalidadDataQuality,
} from "./calidadDataQualityContext"
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
        label: "Sintáctica",
        icon: <CheckCircle />,
        component: <CalidadSintactica />,
      },
      {
        label: "Consistencia",
        icon: <Psychology />,
        component: <CalidadSemantica />,
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
            gap: 1,
            px: 1,
            py: 1,
          }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}>
            <Typography variant="h4" sx={{ fontWeight: "bold", flexShrink: 0 }}>
              Monitoreo de Calidad de Datos
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flexShrink: 1 }}>
              <TextField
                label="Fecha de referencia"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                sx={{ minWidth: 180 }}
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
          </Box>

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
