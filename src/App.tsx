import { useContext } from "react"
import { Admin, Resource } from "react-admin"
import { AuthenticationContext } from "./contexts/AuthContext "
import { dataProvider } from "./dataProviders/dataProvider"
import keycloak from "./keycloak"
import { CustomLayout } from "./layout/CustomLayout"
import { CustomLoginPage } from "./layout/CustomLogin"
import { myAuthKeyCloakProvider } from "./myAuthKeyCloakProvider"
import analisis from "./pages/analisis"
import dashboard from "./pages/dashboard"
import esavis from "./pages/esavis"
import reportes from "./pages/reportes"
import syncs from "./pages/syncs"
import vacunometro from "./pages/vacunometro"
import { theme } from "./theme"

const App = () => {
  const { updateInformationUser, authState } = useContext(AuthenticationContext)

  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={myAuthKeyCloakProvider(keycloak, { updateInformationUser })}
      layout={CustomLayout}
      loginPage={CustomLoginPage}
      theme={theme}>
      <Resource name="dashboard" list={dashboard.list} />
      <Resource name="esavis" list={esavis.list} />
      <Resource name="reportes" list={reportes.list} />
      <Resource name="analisis" list={analisis.list} />
      <Resource name="vacunometro" {...vacunometro} />
      <Resource name="syncs" {...syncs} />
    </Admin>
  )
}

export default App
