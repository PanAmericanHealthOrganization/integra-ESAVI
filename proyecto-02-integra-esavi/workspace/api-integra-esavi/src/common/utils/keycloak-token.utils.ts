import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
// jwks-rsa usa `export =`; sin esModuleInterop en tsconfig, el import default
// no resuelve en runtime (require() no expone `.default`), de ahí el `require`.
import jwksRsa = require('jwks-rsa');

/**
 * Verificación de tokens de Keycloak, compartida por el guard HTTP y el gateway de
 * WebSocket.
 *
 * Es una clase abstracta con métodos estáticos, y no un provider inyectable, a
 * propósito: `KeycloakAuthGuard` se instancia desde el módulo de cada controlador que lo
 * usa, así que darle una dependencia nueva obligaría a declararla en todos ellos. Los
 * handshakes de socket.io, además, ocurren fuera del ciclo de vida de una petición HTTP
 * y no tienen contexto de inyección a mano.
 *
 * El cliente JWKS se construye una sola vez y cachea las claves diez minutos.
 */
export abstract class KeycloakTokenUtils {
  private static readonly logger = new Logger('KeycloakTokenUtils');
  private static issuer: string | null = null;
  private static jwks: ReturnType<typeof jwksRsa> | null = null;

  /**
   * Comprueba que la configuración mínima está presente y prepara el cliente JWKS.
   * Se llama desde el constructor del guard para fallar al arrancar y no en la primera
   * petición: sin estas variables el issuer queda `undefined/realms/undefined` y *todos*
   * los tokens fallan con un 401 que no explica la causa real.
   */
  public static asegurarConfigurado(): void {
    if (this.jwks) return;

    const keycloakUrl = process.env.KEYCLOAK_URL;
    const realm = process.env.KEYCLOAK_REALM;

    if (!keycloakUrl || !realm) {
      throw new Error('Keycloak: faltan KEYCLOAK_URL y/o KEYCLOAK_REALM en la configuración.');
    }

    // El issuer es lo que Keycloak firma en el claim `iss`, y lo ve el NAVEGADOR (p. ej.
    // http://localhost:8080). El JWKS, en cambio, lo descarga ESTE proceso, que en
    // contenedor no alcanza ese host: ahí `localhost` es él mismo. KEYCLOAK_INTERNAL_URL
    // permite apuntar la descarga al nombre de servicio interno (http://keycloak:8080)
    // sin alterar la validación del issuer.
    const internalUrl = process.env.KEYCLOAK_INTERNAL_URL || keycloakUrl;

    this.issuer = `${keycloakUrl}/realms/${realm}`;
    const jwksUri = `${internalUrl}/realms/${realm}/protocol/openid-connect/certs`;

    this.logger.log(`Issuer esperado: ${this.issuer}`);
    this.logger.log(`JWKS: ${jwksUri}`);

    this.jwks = jwksRsa({
      jwksUri,
      cache: true,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
    });
  }

  /**
   * Verifica firma, issuer y vigencia del token.
   *
   * @throws Error si el token es inválido o expiró. Quien llama decide cómo se traduce
   *   eso a su transporte (401 en HTTP, desconexión en WebSocket).
   */
  public static verificar(token: string): Promise<jwt.JwtPayload> {
    this.asegurarConfigurado();

    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.obtenerClaveDeFirma,
        { issuer: this.issuer, algorithms: ['RS256'] },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded as jwt.JwtPayload);
        },
      );
    });
  }

  private static obtenerClaveDeFirma = (
    header: jwt.JwtHeader,
    callback: jwt.SigningKeyCallback,
  ) => {
    KeycloakTokenUtils.jwks.getSigningKey(header.kid, (err, key) => {
      if (err) return callback(err);
      callback(null, key.getPublicKey());
    });
  };
}
