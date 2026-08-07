import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Roles de Keycloak que pueden invocar el endpoint. Se lee en `RolesGuard`, que
 * debe ir acompañado de `KeycloakAuthGuard` (es quien deja el token verificado
 * en `request.user`).
 *
 * Ejemplo: `@UseGuards(KeycloakAuthGuard, RolesGuard) @Roles('admin')`
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
