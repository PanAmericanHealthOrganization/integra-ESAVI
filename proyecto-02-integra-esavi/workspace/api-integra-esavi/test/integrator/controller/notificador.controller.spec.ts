import {GUARDS_METADATA} from '@nestjs/common/constants';
import {Reflector} from '@nestjs/core';
import {ROLES_KEY} from 'src/common/decorators/roles.decorator';
import {KeycloakAuthGuard} from 'src/common/guards/keycloak-auth.guard';
import {RolesGuard} from 'src/common/guards/roles.guard';
import {NotificadorController} from 'src/integrator/controller/notificador.controller';

/**
 * El padrón de notificadores son datos personales de profesionales de salud. Estas pruebas
 * fijan el reparto elegido: leer exige estar autenticado, escribir exige además rol `admin`
 * porque cambia a quién queda atribuida una notificación.
 */
describe('NotificadorController (protección)', () => {
  const reflector = new Reflector();

  const rolesDe = (nombre: string) =>
    reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      NotificadorController.prototype[nombre],
      NotificadorController,
    ]);

  it('exige token de Keycloak en toda la clase', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, NotificadorController) ?? [];

    expect(guards).toContain(KeycloakAuthGuard);
    expect(guards).toContain(RolesGuard);
    // El orden importa: RolesGuard lee request.user, que deja KeycloakAuthGuard.
    expect(guards.indexOf(KeycloakAuthGuard)).toBeLessThan(guards.indexOf(RolesGuard));
  });

  it.each(['create', 'update', 'delete'])('la escritura en %s exige rol admin', (nombre) => {
    expect(rolesDe(nombre)).toEqual(['admin']);
  });

  it.each(['findAll', 'findOne'])('la lectura en %s se conforma con autenticarse', (nombre) => {
    // Sin @Roles, RolesGuard deja pasar a cualquier usuario con token válido.
    expect(rolesDe(nombre)).toBeUndefined();
  });

  it('no restringe la clase entera a un rol', () => {
    expect(Reflect.getMetadata(ROLES_KEY, NotificadorController)).toBeUndefined();
  });
});

/**
 * El usuario de la auditoría sale del token verificado. Antes salía de una cabecera
 * `x-username` que el frontend nunca envió, así que CREATED_BY/UPDATED_BY quedaban siempre
 * en el usuario de reserva.
 */
describe('NotificadorController (auditoría)', () => {
  let controller: NotificadorController;
  let service: { create: jest.Mock; update: jest.Mock; delete: jest.Mock };

  const tokenCon = (payload: Record<string, unknown>) =>
    `Bearer cabecera.${Buffer.from(JSON.stringify(payload)).toString('base64')}.firma`;

  const peticion = (authorization?: string, extras: Record<string, string> = {}) =>
    ({ headers: { authorization, ...extras } } as any);

  beforeEach(() => {
    service = { create: jest.fn(), update: jest.fn(), delete: jest.fn() };
    controller = new NotificadorController(service as any);
  });

  it('toma el usuario del token en create', () => {
    const body = { identificacion: '1712345678' } as any;
    controller.create(body, peticion(tokenCon({ preferred_username: 'rcasigna' })));

    expect(service.create).toHaveBeenCalledWith(body, 'rcasigna');
  });

  it('toma el usuario del token en update', () => {
    const body = { nombres: 'Ana' } as any;
    controller.update('1712345678', body, peticion(tokenCon({ preferred_username: 'rcasigna' })));

    expect(service.update).toHaveBeenCalledWith('1712345678', body, 'rcasigna');
  });

  it('toma el usuario del token en delete', () => {
    controller.delete('1712345678', peticion(tokenCon({ preferred_username: 'rcasigna' })));

    expect(service.delete).toHaveBeenCalledWith('1712345678', 'rcasigna');
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
