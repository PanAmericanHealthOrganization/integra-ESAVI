import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { KeycloakTokenUtils } from '../utils/keycloak-token.utils';

/**
 * Autenticación por token de Keycloak.
 *
 * La verificación en sí (issuer, JWKS, firma) vive en `KeycloakTokenUtils`, compartida
 * con el gateway de WebSocket para que HTTP y sockets validen exactamente igual.
 */
@Injectable()
export class KeycloakAuthGuard implements CanActivate {
  private readonly logger = new Logger(KeycloakAuthGuard.name);

  constructor() {
    // Falla al arrancar, no en la primera petición, si falta configuración.
    KeycloakTokenUtils.asegurarConfigurado();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      request.user = await KeycloakTokenUtils.verificar(authHeader.slice(7));
    } catch (error) {
      const motivo = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Token Keycloak inválido: ${motivo}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }
}
