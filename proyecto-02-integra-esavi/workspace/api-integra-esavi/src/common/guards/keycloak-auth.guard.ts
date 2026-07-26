import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
// jwks-rsa usa `export =`; sin esModuleInterop en tsconfig, el import default
// no resuelve en runtime (require() no expone `.default`), de ahí el `require`.
import jwksRsa = require('jwks-rsa');

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
  private readonly logger = new Logger(KeycloakAuthGuard.name);
  private readonly issuer: string;
  private readonly jwks: ReturnType<typeof jwksRsa>;

  constructor(private readonly configService: ConfigService) {
    const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
    const realm = this.configService.get<string>('KEYCLOAK_REALM');

    if (!keycloakUrl || !realm) {
      // Sin esto el issuer queda "undefined/realms/undefined" y TODOS los
      // tokens fallan con un 401 que no explica la causa real.
      throw new Error(
        'KeycloakAuthGuard: faltan KEYCLOAK_URL y/o KEYCLOAK_REALM en la configuración.',
      );
    }

    // El issuer es lo que Keycloak firma en el claim `iss`, y lo ve el
    // NAVEGADOR (p. ej. http://localhost:8080). El JWKS, en cambio, lo descarga
    // ESTE proceso, que en contenedor no alcanza ese host: ahí `localhost` es
    // él mismo. KEYCLOAK_INTERNAL_URL permite apuntar la descarga al nombre de
    // servicio interno (http://keycloak:8080) sin alterar la validación del
    // issuer. Si no se define, se usa la misma URL para ambas cosas.
    const internalUrl =
      this.configService.get<string>('KEYCLOAK_INTERNAL_URL') || keycloakUrl;

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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = await this.verifyToken(authHeader.slice(7));
    request.user = payload;
    return true;
  }

  private getSigningKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
    this.jwks.getSigningKey(header.kid, (err, key) => {
      if (err) return callback(err);
      callback(null, key.getPublicKey());
    });
  };

  private verifyToken(token: string): Promise<jwt.JwtPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.getSigningKey,
        { issuer: this.issuer, algorithms: ['RS256'] },
        (err, decoded) => {
          if (err) {
            this.logger.warn(`Token Keycloak inválido: ${err.message}`);
            return reject(new UnauthorizedException('Invalid or expired token'));
          }
          resolve(decoded as jwt.JwtPayload);
        },
      );
    });
  }
}
