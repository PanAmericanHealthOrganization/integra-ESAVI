import InsightsIcon from "@mui/icons-material/Insights"
import PieChartIcon from "@mui/icons-material/PieChart"
import SettingsIcon from "@mui/icons-material/Settings"
import VaccinesIcon from "@mui/icons-material/Vaccines"
import SyncIcon from "@mui/icons-material/Sync"
import TableChartIcon from "@mui/icons-material/TableChart"
import { Menu } from "react-admin"
import Authorize from "../authorization.utils"
import SickIcon from "@mui/icons-material/Sick"
export const CustomMenu = () => (
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

    {/* Puedes agregar más elementos al menú aquí siguiendo el mismo patrón */}
  </Menu>

  // <Menu>
  //         <Menu.Item to="/dashboard" primaryText="Dashboard" leftIcon={<PieChartIcon />} />
  //         <Menu.Item to="/esavis" primaryText="ESAVIS" leftIcon={<VaccinesIcon />} />
  //         <Menu.Item to="/reportes" primaryText="Reportes" leftIcon={<TableChartIcon />} />
  // </Menu>
)
