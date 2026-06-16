import AutoStoriesIcon from "@mui/icons-material/AutoStories"
import CompareArrowsIcon from "@mui/icons-material/CompareArrows"
import FlakyIcon from "@mui/icons-material/Flaky"
import LocalHospitalIcon from "@mui/icons-material/LocalHospital"
import MedicationIcon from "@mui/icons-material/Medication"
import MenuBookIcon from "@mui/icons-material/MenuBook"
import PieChartIcon from "@mui/icons-material/PieChart"
import SegmentIcon from "@mui/icons-material/Segment"
import SettingsIcon from "@mui/icons-material/Settings"
import SickIcon from "@mui/icons-material/Sick"
import SyncIcon from "@mui/icons-material/Sync"
import VaccinesIcon from "@mui/icons-material/Vaccines"
import { useState } from "react"
import { Menu } from "react-admin"
import Authorize from "../authorization.utils"
import SubMenu from "./SubMenu"
export const CustomMenu = () => {
  const [estandaresOpen, setEstandaresOpen] = useState(false)

  return (
    <>
      <Menu>
        {/* Dashboard: visible para todos */}
        <Authorize
          allowedRoles={[
            "Administrador",
            "Analista de Información",
            "Visualizador",
            "Invitado",
          ]}
          deniedRoles={[""]}>
          <Menu.Item
            to="/dashboard"
            primaryText="Dashboard"
            leftIcon={<PieChartIcon />}
          />
        </Authorize>
        <Menu.Item
          to="/dashboard"
          primaryText="Dashboard"
          leftIcon={<PieChartIcon />}
        />

        <Authorize
          allowedRoles={["Administrador", "Analista de Información"]}
          deniedRoles={[""]}></Authorize>

        <Menu.Item to="/esavis" primaryText="ESAVIS" leftIcon={<SickIcon />} />

        <Menu.Item
          to="/parametros"
          primaryText="Parametros"
          leftIcon={<SettingsIcon />}
        />
        <Menu.Item
          to="/gaceta"
          primaryText="Gaceta"
          leftIcon={<AutoStoriesIcon />}
        />
        <Menu.Item
          to="/calidad"
          primaryText="Calidad de Datos"
          leftIcon={<FlakyIcon />}
        />
        <Menu.Item
          to="/esavis-dashboard"
          primaryText="ESAVIS Dashboard"
          leftIcon={<FlakyIcon />}
        />

        <Menu.Item
          to="/configuraciones"
          primaryText="Configuraciones"
          leftIcon={<SettingsIcon />}
        />
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
        <Menu.Item
          to="/catalogos"
          primaryText="Catálogos"
          leftIcon={<SegmentIcon />}
        />
        <Authorize allowedRoles={["admin"]} deniedRoles={[""]}>
          <Menu.Item
            to="/homologators"
            primaryText="Homologación"
            leftIcon={<CompareArrowsIcon />}
          />
        </Authorize>

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
