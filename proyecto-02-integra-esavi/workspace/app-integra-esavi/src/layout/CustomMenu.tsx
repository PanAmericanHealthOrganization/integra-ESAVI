import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings"
import CompareArrowsIcon from "@mui/icons-material/CompareArrows"
import DashboardIcon from "@mui/icons-material/Dashboard"
import FlakyIcon from "@mui/icons-material/Flaky"
import LocationCityIcon from "@mui/icons-material/LocationCity"
import LocalHospitalIcon from "@mui/icons-material/LocalHospital"
import MedicationIcon from "@mui/icons-material/Medication"
import MenuBookIcon from "@mui/icons-material/MenuBook"
import SegmentIcon from "@mui/icons-material/Segment"
import SettingsIcon from "@mui/icons-material/Settings"
import SickIcon from "@mui/icons-material/Sick"
import SyncIcon from "@mui/icons-material/Sync"
import VaccinesIcon from "@mui/icons-material/Vaccines"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import { useState } from "react"
import { Menu } from "react-admin"
import Authorize from "../authorization.utils"
import SubMenu from "./SubMenu"
export const CustomMenu = () => {
  const [estandaresOpen, setEstandaresOpen] = useState(false)
  const [configuracionesOpen, setConfiguracionesOpen] = useState(false)

  const isConfiguracionesActive =
    window.location.pathname.startsWith("/parametros") ||
    window.location.pathname.startsWith("/catalogos-config") ||
    window.location.pathname.startsWith("/dpa") ||
    window.location.pathname.startsWith("/establecimientos")

  return (
    <>
      <Menu>
        <Menu.Item to="/esavis" primaryText="ESAVIS" leftIcon={<SickIcon />} />
        <Menu.Item
          to="/calidad"
          primaryText="Calidad de Datos"
          leftIcon={<FlakyIcon />}
        />
        <ListItem disablePadding>
          <ListItemButton
            component="a"
            href={import.meta.env.VITE_DASH_APP}
sx={{ pl: "16px", minHeight: 48 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="ESAVIS Dashboard" />
          </ListItemButton>
        </ListItem>

        {/* Configuraciones — solo rol "admin" */}
        <Authorize allowedRoles={["admin"]} deniedRoles={[""]}>
          <SubMenu
            dense={false}
            handleToggle={() => setConfiguracionesOpen((v) => !v)}
            icon={<SettingsIcon />}
            isOpen={configuracionesOpen || isConfiguracionesActive}
            name="Configuraciones">
            <Menu.Item
              to="/parametros"
              primaryText="Parametros"
              leftIcon={<SettingsIcon />}
            />
            <Menu.Item
              to="/catalogos-config"
              primaryText="Catálogos"
              leftIcon={<SegmentIcon />}
            />
            <Menu.Item
              to="/homologators"
              primaryText="Homologación"
              leftIcon={<CompareArrowsIcon />}
            />
            <Menu.Item
              to="/dpa"
              primaryText="DPA"
              leftIcon={<LocationCityIcon />}
            />
            <Menu.Item
              to="/establecimientos"
              primaryText="Establecimientos"
              leftIcon={<LocalHospitalIcon />}
            />
            <Menu.Item
              to="/admin"
              primaryText="Administración"
              leftIcon={<AdminPanelSettingsIcon />}
            />
          </SubMenu>
        </Authorize>
        <Menu.Item
          to="/vacunometro"
          primaryText="Vacunometro"
          leftIcon={<VaccinesIcon />}
        />
        <Menu.Item
          to="/syncs"
          primaryText="Procesos de sincronización"
          leftIcon={<SyncIcon />}
        />
        {/* Estándares */}
        <SubMenu
          dense={false}
          handleToggle={() => setEstandaresOpen((v) => !v)}
          icon={<MenuBookIcon />}
          isOpen={estandaresOpen}
          name="Estándares">
          <Menu.Item
            to="/meddra"
            primaryText="MedDRA"
            leftIcon={<LocalHospitalIcon />}
          />
          <Menu.Item
            to="/whodrug"
            primaryText="WHODrug"
            leftIcon={<MedicationIcon />}
          />
          <Menu.Item
            to="/estandar-syncs"
            primaryText="Sincronizaciones"
            leftIcon={<SyncIcon />}
          />
        </SubMenu>
      </Menu>
    </>
  )
}
