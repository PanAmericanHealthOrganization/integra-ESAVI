import { KeycloakConfig, KeycloakInitOptions, KeycloakTokenParsed } from 'keycloak-js';
import { Admin, Resource } from 'react-admin';
import MyAuthProvider from './authProvider';
import { dataProvider } from './dataProviders/dataProvider';
import { CustomLayout } from './layout/CustomLayout';
import { CustomLoginPage } from './layout/CustomLogin';
import esavis from './pages/esavis';
import reportes from './pages/reportes';
import dashboard from './pages/dashboard';
import diccionario from './pages/diccionario';


const config: KeycloakConfig = {
	url: 'http://localhost:8090',
	realm: 'integra-esavi-realm',
	clientId: 'integra_esavi_web'
};

const initOptions: KeycloakInitOptions = {
	onLoad: 'login-required',
	pkceMethod: 'S256',
	checkLoginIframe: false
};

const getPermissions = (decoded: KeycloakTokenParsed) => {
	const roles = decoded?.realm_access?.roles;
	if (!roles) {
		return false;
	}
	if (roles.includes('admin')) return 'admin';
	if (roles.includes('user')) return 'user';
	return false;
};

console.log('process.env.REACT_APP_INTEGRA_ESAVI_API_URL:::: ', process.env.REACT_APP_INTEGRA_ESAVI_API_URL);


//
const App = () => {
	return (
		<Admin dataProvider={dataProvider} authProvider={MyAuthProvider} layout={CustomLayout} loginPage={CustomLoginPage}>
			<Resource
				name="dashboard"
				list={dashboard.list}

			/>
			
			<Resource
				name="esavis"
				list={esavis.list}
				create={esavis.create}
				edit={esavis.update}
				show={esavis.show}
			/>
			<Resource
				name="reportes"
				list={reportes.list}		
			/>
			<Resource
				name="diccionarios"
				list={diccionario.list}	
			/>

		</Admin>
	);
};

export default App;
