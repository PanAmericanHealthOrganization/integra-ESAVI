import { lazy, Suspense, useContext } from "react"
import { Admin, Resource } from "react-admin"
import { AuthenticationContext } from "./contexts/AuthContext "
import { dataProvider } from "./dataProviders/dataProvider"
import keycloak from "./keycloak"
import { CustomLayout } from "./layout/CustomLayout"
import { CustomLoginPage } from "./layout/CustomLogin"
import { myAuthKeyCloakProvider } from "./myAuthKeyCloakProvider"
import analisis from "./pages/analisis"
import catalogos from "./pages/catalogos"
import dashboard from "./pages/dashboard"
import { EsaviDashboardList } from "./pages/esavi-dashboard/esavi-dashboard"
import esavis from "./pages/esavis"
import gaceta from "./pages/gaceta"
import parametros from "./pages/parametros"
import reportes from "./pages/reportes"
import syncs from "./pages/syncs"
import vacunometro from "./pages/vacunometro"

import configuraciones from "./configuraciones"
import { XlsxList2 as XlsxList } from "./pages/xlsx/XlsxList2"
import { theme } from "./theme"
//import { createHashHistory } from 'history';

// Dynamic import para el dashboard de calidad
const CalidadDashList = lazy(() =>
  import("./pages/calidad/calidadDashList").then((module) => ({
    default: module.CalidadDashList,
  }))
)

const App = () => {
  const { updateInformationUser, authState } = useContext(AuthenticationContext)

  //const history = createHashHistory();
  return (
    <Admin
      // history={history}
      dataProvider={dataProvider}
      authProvider={myAuthKeyCloakProvider(keycloak, { updateInformationUser })}
      layout={CustomLayout}
      loginPage={CustomLoginPage}
      theme={theme}>
      {/* Recurso XLSX como Resource usando dataProvider híbrido */}
      <Resource
        name="xlsx"
        options={{ label: "Datos de Campo de BDD ESAVI" }}
        list={XlsxList}
      />
      <Resource
        name="dashboard"
        options={{ label: "Dashboard" }}
        list={dashboard.list}
      />
      <Resource name="esavis" list={esavis.list} />
      <Resource
        name="reportes"
        options={{ label: "Reportes" }}
        list={reportes.list}
      />
      <Resource name="analisis" list={analisis.list} />
      <Resource name="vacunometro" {...vacunometro} />
      <Resource name="configuraciones" {...configuraciones} />
      <Resource name="parametros" {...parametros} />
      <Resource
        name="calidad"
        list={
          <Suspense fallback={<div>Cargando...</div>}>
            <CalidadDashList />
          </Suspense>
        }
      />
      <Resource name="syncs" {...syncs} />
      <Resource name="catalogos" {...catalogos} />
      <Resource name="esavis-dashboard" list={EsaviDashboardList} />
      <Resource name="gaceta" {...gaceta} />
    </Admin>
  )
}

export default App
