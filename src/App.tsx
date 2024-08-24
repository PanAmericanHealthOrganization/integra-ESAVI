import { Admin, Resource } from 'react-admin';
import { dataProvider } from './dataProviders/dataProvider';
import { CustomLayout } from './layout/CustomLayout';
import { CustomLoginPage } from './layout/CustomLogin';
import esavis from './pages/esavis';
import reportes from './pages/reportes';
import dashboard from './pages/dashboard';
import { myAuthKeyCloakProvider } from './myAuthKeyCloakProvider';
import keycloak from './keycloak';

const App = () => {
	return (
		<Admin
			dataProvider={dataProvider}
			authProvider={myAuthKeyCloakProvider(keycloak)}
			layout={CustomLayout}
			loginPage={CustomLoginPage}
		>
			<Resource name="dashboard" list={dashboard.list} />
			<Resource
				name="esavis"
				list={esavis.list}
				create={esavis.create}
				edit={esavis.update}
				show={esavis.show}
			/>
			<Resource name="reportes" list={reportes.list} />
		</Admin>
	);
};

export default App;
