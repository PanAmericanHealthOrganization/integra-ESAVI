import {GUARDS_METADATA} from '@nestjs/common/constants';
import {Reflector} from '@nestjs/core';
import {ROLES_KEY} from '../../common/decorators/roles.decorator';
import {KeycloakAuthGuard} from '../../common/guards/keycloak-auth.guard';
import {RolesGuard} from '../../common/guards/roles.guard';
import {ParametroController} from './parametro.controller';

/**
 * TC_PARAMETRO devuelve las credenciales de todas las integraciones ya descifradas: que
 * este controlador quede expuesto es una fuga de secretos, no una molestia de permisos.
 * Estas pruebas fijan la protección para que nadie la retire sin darse cuenta.
 */
describe('ParametroController (protección)', () => {
  const reflector = new Reflector();

  /** Todos los manejadores del controlador, tal como los ve Nest al enrutar. */
  const manejadores = Object.getOwnPropertyNames(ParametroController.prototype)
    .filter((nombre) => nombre !== 'constructor')
    .map((nombre) => [nombre, ParametroController.prototype[nombre]] as const);

  it('expone los cinco endpoints esperados', () => {
    expect(manejadores.map(([nombre]) => nombre).sort()).toEqual([
      'create',
      'delete',
      'findAll',
      'findOne',
      'update',
    ]);
  });

  it('exige token de Keycloak y rol en toda la clase', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, ParametroController) ?? [];

    expect(guards).toContain(KeycloakAuthGuard);
    expect(guards).toContain(RolesGuard);
    // El orden importa: RolesGuard lee request.user, que deja KeycloakAuthGuard.
    expect(guards.indexOf(KeycloakAuthGuard)).toBeLessThan(guards.indexOf(RolesGuard));
  });

  it('restringe la clase al rol admin', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ParametroController)).toEqual(['admin']);
  });

  it.each(manejadores)('el endpoint %s hereda la exigencia de rol admin', (_nombre, manejador) => {
    // Es lo que resuelve RolesGuard: sin @Roles propio, el manejador toma el de la clase.
    const roles = reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      manejador,
      ParametroController,
    ]);

    expect(roles).toEqual(['admin']);
  });
});

/**
 * El usuario de la auditoría sale del token que ya verificó `KeycloakAuthGuard`. Antes salía
 * de una cabecera `x-username` que nadie enviaba —el frontend jamás la puso— y que cualquiera
 * podía inventar, de modo que CREATED_BY/UPDATED_BY quedaban siempre en el usuario de reserva.
 */
describe('ParametroController (auditoría)', () => {
  let controller: ParametroController;
  let service: { create: jest.Mock; update: jest.Mock; delete: jest.Mock };

  /** Token con la forma que espera getUsernameFromJwt: sólo importa el payload. */
  const tokenCon = (payload: Record<string, unknown>) =>
    `Bearer cabecera.${Buffer.from(JSON.stringify(payload)).toString('base64')}.firma`;

  const peticion = (authorization?: string, extras: Record<string, string> = {}) =>
    ({ headers: { authorization, ...extras } } as any);

  beforeEach(() => {
    service = { create: jest.fn(), update: jest.fn(), delete: jest.fn() };
    controller = new ParametroController(service as any);
  });

  it('toma el usuario del token en create', () => {
    const body = { clave: 'WHD_API_URL' } as any;
    controller.create(body, peticion(tokenCon({ preferred_username: 'rcasigna' })));

    expect(service.create).toHaveBeenCalledWith(body, 'rcasigna');
  });

  it('toma el usuario del token en update', () => {
    const body = { valor: 'nuevo' } as any;
    const uuid = '0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0';
    controller.update(uuid, body, peticion(tokenCon({ preferred_username: 'rcasigna' })));

    expect(service.update).toHaveBeenCalledWith(uuid, body, 'rcasigna');
  });

  it('toma el usuario del token en delete', () => {
    const uuid = '0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0';
    controller.delete(uuid, peticion(tokenCon({ preferred_username: 'rcasigna' })));

    expect(service.delete).toHaveBeenCalledWith(uuid, 'rcasigna');
  });

  it('ignora la cabecera x-username: ya no puede suplantar a nadie', () => {
    controller.create(
      {} as any,
      peticion(tokenCon({ preferred_username: 'rcasigna' }), { 'x-username': 'intruso' }),
    );

    expect(service.create).toHaveBeenCalledWith(expect.anything(), 'rcasigna');
  });

  it('cae al usuario de reserva si el token no trae preferred_username', () => {
    controller.create({} as any, peticion(tokenCon({ sub: 'sin-nombre' })));

    const [, usuario] = service.create.mock.calls[0];
    expect(usuario).toBe(process.env.USUARIO_INSERTA_REGISTRO || 'SYSTEM');
  });
});
