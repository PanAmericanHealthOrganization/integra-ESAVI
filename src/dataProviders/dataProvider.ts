import { combineDataProviders } from 'react-admin';
import { esaviDataProvider } from './esavis.dataprovider';
import { reporteDataProvider } from './reportes.dataprovider';
import { dashboardDataProvider } from './dashboard.dataprovider';

export const dataProvider = combineDataProviders((resource) => {
	switch (resource) {
		case 'dashboard':
			return dashboardDataProvider;
		case 'reportes':
			return reporteDataProvider;
		case 'esavis':
			return esaviDataProvider;
		default:
			throw new Error(`Unknown resource: ${resource}`);
	}
});
