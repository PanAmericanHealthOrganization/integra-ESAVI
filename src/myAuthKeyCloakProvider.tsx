import jwt_decode from 'jwt-decode';
import Keycloak, { KeycloakTokenParsed } from 'keycloak-js';
import { AuthProvider } from 'react-admin';

export type PermissionsFunction = (decoded: KeycloakTokenParsed) => any;

/**
 * An authProvider which handles authentication via the Keycloak server.
 *
 * @param client the keycloak client
 * @param options.onPermissions function used to transform the permissions fetched from Keycloak into a permissions object in the form of what your react-admin app expects
 * @param options.loginRedirectUri URI used to override the redirect URI after successful login
 * @param options.logoutRedirectUri URI used to override the redirect URI after successful logout
 *
 * @returns an authProvider ready to be used by React-Admin.
 */
export const myAuthKeyCloakProvider = (
	client: Keycloak,
	options: {
		onPermissions?: PermissionsFunction;
		loginRedirectUri?: string;
		logoutRedirectUri?: string;
	} = {}
): AuthProvider => ({
	async login() {
		return client.login({
			redirectUri: options.loginRedirectUri ?? window.location.origin
		});
	},
	async logout() {
		return client.logout({
			redirectUri: options.logoutRedirectUri ?? window.location.origin
		});
	},
	async checkError() {
		return Promise.resolve();
	},
	async checkAuth() {
		return client.authenticated && client.token
			? Promise.resolve()
			: Promise.reject('Failed to obtain access token.');
	},
	async getPermissions() {
		if (!client.token) {
			return Promise.resolve(false);
		}
		const decoded = jwt_decode<KeycloakTokenParsed>(client.token);
		return Promise.resolve(options.onPermissions ? options.onPermissions(decoded) : decoded);
	},
	async getIdentity() {
		if (client.token) {
			const decoded = jwt_decode<KeycloakTokenParsed>(client.token);
			const id = decoded.sub || '';
			const fullName = decoded.preferred_username;
			return Promise.resolve({ id, fullName });
		}
		return Promise.reject('Failed to get identity.');
	}
});
