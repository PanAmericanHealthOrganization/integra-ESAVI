import { combineDataProviders } from 'react-admin';
import { catalogoDataProvider } from './catalogos.dataprovider';
import { esaviDataProvider } from './esavis.dataprovider';
import { patientProvider } from './patient.dataprovider';
import { reporteDataProvider } from './reportes.dataprovider';
import { dashboardDataProvider } from './dashboard.dataprovider';


export const dataProvider = combineDataProviders((resource) => {
	switch (resource) {
		case 'dashboard':
			return dashboardDataProvider;
		case 'pacientes':
			return patientProvider;
		case 'reportes':
			return reporteDataProvider;
		case 'catalogos':
			return catalogoDataProvider;
		case 'esavis':
			return esaviDataProvider;
		default:
			throw new Error(`Unknown resource: ${resource}`);
	}
});
