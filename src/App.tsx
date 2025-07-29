import { Admin, Resource } from "react-admin"
import { dataProvider } from "./dataProviders/dataProvider"
import { CustomLayout } from "./layout/CustomLayout"
import { CustomLoginPage } from "./layout/CustomLogin"
import esavis from "./pages/esavis"
import reportes from "./pages/reportes"
import dashboard from "./pages/dashboard"
import keycloak from "./keycloak"
import { useContext } from "react"
import { myAuthKeyCloakProvider } from "./myAuthKeyCloakProvider"
import { AuthenticationContext } from "./contexts/AuthContext "
import analisis from "./pages/analisis"
import vacunasAgregado from "./pages/vacunas-agregado"

const App = () => {
  const { updateInformationUser, authState } = useContext(AuthenticationContext)

  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={myAuthKeyCloakProvider(keycloak, { updateInformationUser })}
      layout={CustomLayout}
      loginPage={CustomLoginPage}>
      <Resource name="dashboard" list={dashboard.list} />
      <Resource name="esavis" list={esavis.list} />
      <Resource name="reportes" list={reportes.list} />
      <Resource name="analisis" list={analisis.list} />

      <Resource name="vacunas-agregado" {...vacunasAgregado} />
    </Admin>
  )
}

export default App
