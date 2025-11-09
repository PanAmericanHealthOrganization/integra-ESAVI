import AutoStoriesIcon from "@mui/icons-material/AutoStories"
import FlakyIcon from "@mui/icons-material/Flaky"
import PieChartIcon from "@mui/icons-material/PieChart"
import SegmentIcon from "@mui/icons-material/Segment"
import SettingsIcon from "@mui/icons-material/Settings"
import SickIcon from "@mui/icons-material/Sick"
import SyncIcon from "@mui/icons-material/Sync"
import TableChartIcon from "@mui/icons-material/TableChart"
import VaccinesIcon from "@mui/icons-material/Vaccines"
import { Menu } from "react-admin"
import Authorize from "../authorization.utils"
export const CustomMenu = () => (
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

      {/* Reportes: visible solo si el usuario tiene el rol "Administrador" */}

      <Menu.Item
        to="/reportes"
        primaryText="Reportes"
        leftIcon={<TableChartIcon />}
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
        primaryText="Catalogos"
        leftIcon={<SegmentIcon />}
      />
    </Menu>
  </>
)
