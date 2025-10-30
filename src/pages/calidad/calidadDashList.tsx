import {
  Assessment,
  CheckCircle,
  Code,
  Psychology,
  Schedule,
} from "@mui/icons-material"
import { Box, Container, Paper, Tab, Tabs } from "@mui/material"
import React, { useState } from "react"

// Importar componentes de tabs
import CalidadCompletitud from "./tabs/calidad_completitud"
import { CalidadGeneral } from "./tabs/calidad_genera"
import CalidadSemantica from "./tabs/calidad_semantica"
import CalidadSintactica from "./tabs/calidad_sintactica"
import CalidadTemporal from "./tabs/calidad_temporal"

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

export const CalidadDashList: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  const tabs = [
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
  ]

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ width: "100%" }}>
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

export default CalidadDashList
