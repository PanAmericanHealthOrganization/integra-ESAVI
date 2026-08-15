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
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { Menu, useSidebarState } from "react-admin"
import Authorize from "../authorization.utils"
import { PALETA } from "../theme"
import { CustomFooter } from "./CustomFooter"
import SubMenu from "./SubMenu"

/**
 * Rótulo de sección del menú.
 *
 * La plataforma de referencia agrupa su navegación bajo encabezados en versalitas grises
 * («Principal», «Atención clínica», «Operación», «Sistema») en lugar de dejar una lista
 * plana. Aquí se replica el patrón sobre los destinos que ya existían: no se añade ni se
 * quita ninguna pantalla, sólo se agrupan.
 *
 * Desaparece con la barra plegada, donde sólo quedan los iconos y un rótulo de texto no
 * tendría a qué titular.
 */
const SeccionMenu = ({ children }: { children: string }) => {
  const [sidebarIsOpen] = useSidebarState()
  if (!sidebarIsOpen) return null

  // `component="li"`: el `<Menu>` de react-admin es un `MenuList`, o sea un `<ul>`, y ahí
  // sólo pueden colgar `<li>`.
  return (
    <Typography
      component="li"
      sx={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: PALETA.textoTenue,
        listStyle: "none",
        px: "11px",
        // El primer rótulo va pegado al borde superior; el resto respira más arriba que
        // abajo, para que se lea como cabecera del bloque que sigue y no del anterior.
        mt: 2.25,
        mb: 0.9,
      }}>
      {children}
    </Typography>
  )
}

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
        <SeccionMenu>Principal</SeccionMenu>
        <Menu.Item to="/esavis" primaryText="ESAVIS" leftIcon={<SickIcon />} />
        <ListItem disablePadding>
          <ListItemButton
            component="a"
            href={import.meta.env.VITE_DASH_APP}
            sx={{ borderRadius: "8px", minHeight: 40, px: "11px" }}>
            <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText
              primary="ESAVIS Dashboard"
              primaryTypographyProps={{ fontSize: "13.5px", fontWeight: 500 }}
            />
          </ListItemButton>
        </ListItem>

        <SeccionMenu>Análisis</SeccionMenu>
        <Menu.Item
          to="/calidad"
          primaryText="Calidad de Datos"
          leftIcon={<FlakyIcon />}
        />
        <Menu.Item
          to="/vacunometro"
          primaryText="Vacunometro"
          leftIcon={<VaccinesIcon />}
        />

        <SeccionMenu>Estándares</SeccionMenu>
        <SubMenu
          dense={false}
          handleToggle={() => setEstandaresOpen((v) => !v)}
          icon={<MenuBookIcon />}
          isOpen={estandaresOpen}
          name="Diccionarios">
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
        </SubMenu>

        <SeccionMenu>Sistema</SeccionMenu>
        <Menu.Item
          to="/syncs"
          primaryText="Procesos de sincronización"
          leftIcon={<SyncIcon />}
        />
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

      </Menu>
      {/*
        El pie va fuera de <Menu>, no dentro.

        Dentro quedaba al final de la lista y, en cuanto los puntos de menú superaban el
        alto de la barra, se iba con el scroll. Como hermano del menú —los dos hijos del
        contenedor .RaSidebar-fixed, que el tema convierte en columna flexible— el menú se
        lleva el alto sobrante y scrollea, y el pie queda clavado al borde inferior.
      */}
      <PieMenu />
    </>
  )
}

/**
 * Pie de la barra lateral: el aviso de derechos que antes vivía en una barra fija a lo
 * ancho de la ventana. Se oculta con la barra plegada, donde no hay sitio para texto.
 */
const PieMenu = () => {
  const [sidebarIsOpen] = useSidebarState()
  if (!sidebarIsOpen) return null

  return <CustomFooter />
}
