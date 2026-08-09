import {keycloakAuthProvider} from "ra-keycloak"
import {lazy,useContext,useRef} from "react"
import {Admin,Resource,usePermissions,Notification} from "react-admin"
import {Navigate} from "react-router-dom"


const NotificacionPersonalizada = () => (
  <Notification anchorOrigin={{ vertical: "top", horizontal: "right" }} />
)
import {AuthenticationContext} from "./contexts/AuthContext "
import {dataProvider} from "./dataProviders/dataProvider"
import keycloak from "./keycloak"
import {CustomLayout} from "./layout/CustomLayout"
import {CustomLoginPage} from "./layout/CustomLogin"
import {CatalogosConfigList} from "./pages/catalogos-config/catalogosConfigList"
import dashboard from "./pages/dashboard"
import esavis from "./pages/esavis"
import gaceta from "./pages/gaceta"
import {ParametrosList} from "./pages/parametros/parametrosList"
import syncs from "./pages/syncs"
import vacunometro from "./pages/vacunometro"

import configuraciones from "./configuraciones"
import {DpaList} from "./pages/dpa/DpaList"
import { EstablecimientoList } from "./pages/establecimientos/EstablecimientoList"
import {HomologadoresPage} from "./pages/homologators/HomologadoresPage"
import {AdminPage} from "./pages/admin/AdminPage"
import {MeddraPage} from "./pages/estandares/MeddraPage"
import {WhodrugPage} from "./pages/estandares/WhodrugPage"
import {theme} from "./theme"

const AdminGuard = ({ component: Component }: { component: React.ComponentType }) => {
  const { permissions, isPending } = usePermissions()
  const resolvedRef = useRef(false)

  if (!isPending) resolvedRef.current = true

  // Solo bloquear en la carga inicial; durante re-validaciones de token mantener montado
  if (!resolvedRef.current) return null

  if (!Array.isArray(permissions) || !permissions.includes("admin")) {
    return <Navigate to="/esavis" replace />
  }
  return <Component />
}

// Referencias estables fuera de App para evitar desmontaje al re-renderizar
const ParametrosPage      = () => <AdminGuard component={ParametrosList} />
const CatalogosConfigPage = () => <AdminGuard component={CatalogosConfigList} />
const DpaPage             = () => <AdminGuard component={DpaList} />
const EstablecimientosPage= () => <AdminGuard component={EstablecimientoList} />
const HomologadoresGuarded= () => <AdminGuard component={HomologadoresPage} />
const AdminGuardedPage    = () => <AdminGuard component={AdminPage} />

// Dynamic import para el dashboard de calidad
const CalidadDashList = lazy(() =>
  import("./pages/calidad/calidadDashList").then((module) => ({
    default: module.CalidadDashList,
  }))
)

const App = () => {
  const { updateInformationUser, authState } = useContext(AuthenticationContext)

  return (
    <Admin
      requireAuth
      dataProvider={dataProvider}
      authProvider={keycloakAuthProvider(keycloak, {
        initOptions: { onLoad: 'login-required', checkLoginIframe: false },
        onPermissions: (decoded) => {
          updateInformationUser({
            email: decoded.email || null,
            given_name: decoded.given_name || null,
            family_name: decoded.family_name || null,
            name: decoded.name || null,
            preferred_username: decoded.preferred_username || null,
            realm_access: decoded.realm_access || null,
            resource_access: decoded.resource_access || null,
          })
          return decoded.realm_access?.roles || []
        },
      })}
      layout={CustomLayout}
      loginPage={CustomLoginPage}
      notification={NotificacionPersonalizada}
      theme={theme}>
      <Resource name="dashboard" options={{ label: "Dashboard" }} list={dashboard.list} />
      <Resource name="esavis" list={esavis.list} show={esavis.show} />
      <Resource name="vacunometro" {...vacunometro} />
      <Resource name="configuraciones" {...configuraciones} />
      <Resource name="parametros" list={ParametrosPage} />
      <Resource name="calidad" list={CalidadDashList} />
      <Resource name="syncs" {...syncs} />
      <Resource name="catalogos-config" list={CatalogosConfigPage} />
      <Resource name="catalogo-padre" />
      <Resource name="dpa" list={DpaPage} />
      <Resource name="establecimientos" list={EstablecimientosPage} options={{ label: "Establecimientos" }} />
      <Resource name="provincias" />
      <Resource name="cantones" />
      <Resource name="parroquias" />
      <Resource name="gaceta" {...gaceta} />
      <Resource name="homologators" list={HomologadoresGuarded} />
      <Resource name="homologations" />
      <Resource name="admin" options={{ label: "Administración" }} list={AdminGuardedPage} />
      <Resource name="meddra" options={{ label: "MedDRA" }} list={MeddraPage} />
      <Resource name="whodrug" options={{ label: "WHODrug" }} list={WhodrugPage} />
    </Admin>
  )
}

export default App
