import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Identidad del usuario tal como la aporta el token de Keycloak. */
export interface UsuarioAutenticado {
  /** Claim `sub`: el único identificador estable de la persona. */
  id: string;
  /** Claim `preferred_username`. Puede cambiar; sólo para leerlo humanamente. */
  username?: string;
  email?: string;
  roles: string[];
}

/**
 * Extrae la identidad del token que `KeycloakAuthGuard` dejó en `request.user`.
 *
 * Devuelve `null` si el endpoint no está detrás del guard o el token no trae `sub`, para
 * que quien lo use decida qué hacer en vez de recibir un objeto a medio construir.
 *
 * Uso: `@Usuario() usuario: UsuarioAutenticado`
 */
export const Usuario = createParamDecorator(
  (_dato: unknown, ctx: ExecutionContext): UsuarioAutenticado | null => {
    const payload = ctx.switchToHttp().getRequest().user;
    if (!payload?.sub) return null;

    return {
      id: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
      roles: payload.realm_access?.roles ?? [],
    };
  },
);
