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
    this.issuer = `${keycloakUrl}/realms/${realm}`;
    this.jwks = jwksRsa({
      jwksUri: `${this.issuer}/protocol/openid-connect/certs`,
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
