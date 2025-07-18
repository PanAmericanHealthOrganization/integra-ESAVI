import Keycloak, { KeycloakConfig, KeycloakTokenParsed, KeycloakInitOptions } from 'keycloak-js';
import { DataProvider } from 'react-admin';

/**
 *
 * parametros de inicio
 */
export const mspKeycloakInitOptions: KeycloakInitOptions = {
	onLoad: 'login-required'
};

/**
 *
 * Custom metodo para validacion de usuario
 * @param decoded
 * @returns
 */
export const getPermissions = (decoded: KeycloakTokenParsed) => {
	const roles = decoded?.realm_access?.roles;
	if (!roles) {
		return false;
	}
	if (roles.includes('admin')) return 'admin';
	if (roles.includes('user')) return 'user';
	return false;
};

/**
 *
 */
export const keyCloakTokenDataProviderBuilder = (dataProvider: DataProvider, keycloak: Keycloak) =>
	new Proxy(dataProvider, {
		get: (target: DataProvider, name: string) => (resource: any, params: any) => {
			if (typeof name === 'symbol' || name === 'then') {
				return;
			}
			console.log(
				`Simulating call to dataprovider.${name}() with keycloak token: ${keycloak.token}`
			);
			return dataProvider[name](resource, params);
		}
	});

interface ResponseError extends Error {
	status?: number;
}
