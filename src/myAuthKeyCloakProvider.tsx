import Keycloak, { KeycloakTokenParsed } from 'keycloak-js';
import { AuthContext, AuthProvider } from 'react-admin';
import jwt_decode from 'jwt-decode';
import { useContext } from 'react';
import { AuthState } from './contexts/AuthContext ';

export type PermissionsFunction = (decoded: KeycloakTokenParsed) => any;

/**
 * Un AuthProvider que maneja la autenticación a través del servidor KeyCloak.
 *
 * @param client Cliente de keycloak
 * @param options.onPermissions Función utilizada para transformar los permisos obtenidos de KeyCloak en un objeto de permisos en forma de lo que su aplicación React-Admin espera
 * @param options.loginRedirectUri URI used to override the redirect URI after successful login
 * @param options.logoutRedirectUri URI used to override the redirect URI after successful logout
 *
 * @returns Un authprovider listo para ser utilizado por React-Admin.
*/


export const myAuthKeyCloakProvider = (
	
	client: Keycloak,
	options: {
		onPermissions?: (token: KeycloakTokenParsed) => any;
		
		loginRedirectUri?: string;
		logoutRedirectUri?: string;
		updateInformationUser?: (user: AuthState) => any; 
	} = {}
): AuthProvider => ({
	async login() {
		if (!client.authenticated) {
			return Promise.reject('Usuario no autenticado');
		}
		return Promise.resolve();
	},
	async logout() {
		if (client) {
			return client
				.logout()
				.then(() => Promise.resolve())
				.catch(() => Promise.reject('Falló el cierre de sesión'));
		} else {
			return Promise.reject('Keycloak no está inicializado');
		}
	},
	async checkAuth() {
		return client.authenticated ? Promise.resolve() : Promise.reject();
	},
	async checkError(error) {
		if (error.status === 401) {
			return Promise.reject();
		}
		return Promise.resolve();
	},
	async getPermissions() {

		if (!client.token) {
			return Promise.resolve(false);
		}
		const decoded = jwt_decode<KeycloakTokenParsed>(client.token);

		const user: AuthState = {
			email: decoded.email || null,
			given_name: decoded.given_name || null,
			family_name: decoded.family_name || null,
			name: decoded.name || null,
			preferred_username: decoded.preferred_username || null,
			realm_access: decoded.realm_access || null,
			resource_access: decoded.resource_access || null,
		  };
		  if (options.updateInformationUser) {
			 options.updateInformationUser(user);
		  }
		 // Extraer roles del token
		 const roles = decoded.realm_access?.roles || [];

		 console.log("Decoded::" , decoded);

		 console.log("RolesRealm::" , roles);
		 
		 
		return Promise.resolve(options.onPermissions ? options.onPermissions(decoded) : decoded);


	},
	async getIdentity() {
		if (client.token) {
			console.log("Cliente :::" , client);
			
			const decoded = jwt_decode<KeycloakTokenParsed>(client.token);
			const id = decoded.sub || '';
			const fullName = decoded.preferred_username;
			return Promise.resolve({ id, fullName });
		}
		return Promise.reject('No se pudo obtener identidad');
	}
});



