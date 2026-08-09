import keycloak from "../keycloak"

/**
 * Segundos de margen: se renueva el token si le queda menos que esto de vida. Cubre la
 * latencia de la petición y cualquier desfase de reloj entre el navegador y Keycloak.
 */
const MARGEN_SEGUNDOS = 30

/**
 * Renovación del token de Keycloak.
 *
 * `keycloak-js` **no renueva solo**: mantiene el access token hasta que expira y sólo lo
 * refresca cuando alguien llama a `updateToken()`. Como el interceptor de axios leía
 * `keycloak.token` sin renovarlo, pasado el tiempo de vida del token (5 minutos por
 * defecto en Keycloak) toda petición salía con un JWT vencido y el API respondía 401
 * hasta recargar la página.
 *
 * Es abstracta para impedir su instanciación: todos los métodos son estáticos.
 *
 * Llamarla en cada petición no dispara un refresh por petición: `updateToken` sale de
 * inmediato si al token todavía le queda vida, y `keycloak-js` encola las llamadas
 * concurrentes (`refreshQueue`) para que varias peticiones en paralelo compartan una
 * sola renovación.
 */
export abstract class TokenUtils {
  /**
   * Devuelve un token vigente, renovándolo si está por expirar.
   *
   * @returns El token, o `undefined` si no hay sesión o la renovación falló.
   */
  static async asegurarVigente(margenSegundos = MARGEN_SEGUNDOS): Promise<string | undefined> {
    try {
      await keycloak.updateToken(margenSegundos)
    } catch {
      // El refresh token también venció (sesión SSO caducada) o no hay sesión todavía.
      // No se fuerza el login aquí: la petición saldrá sin token válido, el API
      // responderá 401 y react-admin se encarga de redirigir.
    }
    return keycloak.token
  }

  /**
   * Fuerza la renovación aunque al token le quede vida. Se usa al reintentar una petición
   * que el API rechazó con 401, donde el token es inválido para el servidor aunque el
   * navegador lo considere vigente: relojes desfasados, o claves rotadas en Keycloak.
   */
  static async renovarForzado(): Promise<string | undefined> {
    try {
      await keycloak.updateToken(-1)
    } catch {
      // Sin refresh posible; quien llama decide qué hacer con la petición fallida.
    }
    return keycloak.token
  }
}
