import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Autorización por rol de Keycloak.
 *
 * Corre después de `KeycloakAuthGuard`, que ya verificó la firma del token y lo
 * dejó en `request.user`; aquí sólo se comprueba `realm_access.roles`. Sin este
 * guard, ocultar un botón en el frontend no impedía llamar al endpoint
 * directamente.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Sin @Roles el endpoint no exige rol alguno (basta la autenticación).
    if (!rolesRequeridos?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const rolesUsuario: string[] = request.user?.realm_access?.roles ?? [];

    if (!rolesRequeridos.some((rol) => rolesUsuario.includes(rol))) {
      this.logger.warn(
        `Acceso denegado a ${request.method} ${request.url}: requiere [${rolesRequeridos.join(', ')}]`,
      );
      throw new ForbiddenException(`Se requiere uno de los roles: ${rolesRequeridos.join(', ')}`);
    }

    return true;
  }
}
