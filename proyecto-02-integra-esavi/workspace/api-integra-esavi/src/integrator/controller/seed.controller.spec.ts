import {GUARDS_METADATA} from '@nestjs/common/constants';
import {Reflector} from '@nestjs/core';
import {ROLES_KEY} from '../../common/decorators/roles.decorator';
import {KeycloakAuthGuard} from '../../common/guards/keycloak-auth.guard';
import {RolesGuard} from '../../common/guards/roles.guard';
import {SeedController} from './seed.controller';

/**
 * SeedController vacía TR_NOTIFICACION en cascada, trunca todas las tablas TR e inserta
 * cientos de miles de filas simuladas. Que quede accesible sin credenciales es la peor
 * exposición del módulo, así que estas pruebas fijan la protección de toda la clase.
 */
describe('SeedController (protección)', () => {
  const reflector = new Reflector();

  const manejadores = Object.getOwnPropertyNames(SeedController.prototype).filter(
    (nombre) => nombre !== 'constructor',
  );

  it('cubre los seis endpoints del controlador', () => {
    expect(manejadores.sort()).toEqual([
      'cleanData',
      'cleanTRTables',
      'seedData',
      'seedSimulacionVacunacion',
      'seedVacunometro',
      'truncateNotificacion',
    ]);
  });

  it('exige token de Keycloak en toda la clase', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, SeedController) ?? [];

    expect(guards).toContain(KeycloakAuthGuard);
    expect(guards).toContain(RolesGuard);
    // El orden importa: RolesGuard lee request.user, que deja KeycloakAuthGuard.
    expect(guards.indexOf(KeycloakAuthGuard)).toBeLessThan(guards.indexOf(RolesGuard));
  });

  it('restringe la clase al rol admin', () => {
    expect(Reflect.getMetadata(ROLES_KEY, SeedController)).toEqual(['admin']);
  });

  it.each(['cleanData', 'cleanTRTables', 'truncateNotificacion'])(
    'el endpoint destructivo %s exige rol admin',
    (nombre) => {
      const roles = reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        SeedController.prototype[nombre],
        SeedController,
      ]);

      expect(roles).toEqual(['admin']);
    },
  );

  it.each(['seedData', 'seedVacunometro', 'seedSimulacionVacunacion'])(
    'el endpoint de carga masiva %s exige rol admin',
    (nombre) => {
      const roles = reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        SeedController.prototype[nombre],
        SeedController,
      ]);

      expect(roles).toEqual(['admin']);
    },
  );
});

/**
 * El corte por ambiente de la simulación es independiente del guard: uno impide correrla en
 * producción, el otro impide que la llame alguien sin credenciales. Se comprueba aquí para
 * que nadie los confunda y retire uno pensando que el otro cubre lo mismo.
 */
describe('SeedController (corte por ambiente)', () => {
  const envOriginal = process.env.ENV;
  /** Identidad que `@Usuario()` extrae del token; es el destinatario del aviso final. */
  const usuario = { id: 'sub-123', username: 'admin', roles: ['admin'] };
  let controller: SeedController;
  let service: { seedSimulacionVacunacionDiaria: jest.Mock };

  beforeEach(() => {
    service = {
      seedSimulacionVacunacionDiaria: jest
        .fn()
        .mockResolvedValue({ insertados: 1, establecimientos: 1, dias: 1 }),
    };
    controller = new SeedController(service as any);
  });

  afterEach(() => {
    process.env.ENV = envOriginal;
  });

  it.each(['PROD', 'PRODUCCION', 'prod'])('rechaza la simulación con ENV=%s', async (env) => {
    process.env.ENV = env;

    await expect(
      controller.seedSimulacionVacunacion('2026-08-01', '2026-08-07', usuario),
    ).rejects.toThrow(/producción/);
    expect(service.seedSimulacionVacunacionDiaria).not.toHaveBeenCalled();
  });

  it('permite la simulación fuera de producción', async () => {
    process.env.ENV = 'DEV';

    await expect(
      controller.seedSimulacionVacunacion('2026-08-01', '2026-08-07', usuario),
    ).resolves.toMatchObject({ dias: 1 });
    expect(service.seedSimulacionVacunacionDiaria).toHaveBeenCalled();
  });

  /*
   * El aviso al buzón depende por completo de que el usuario del token llegue hasta
   * `SyncService.ejecutarConRegistro`: si el controlador no lo reenvía, la simulación se
   * ejecuta y se registra igual, pero la campana se queda vacía. Era exactamente el fallo
   * que se veía —salía el toast del formulario y no aparecía ninguna notificación—, y como
   * no rompe nada visible desde el servidor, sólo una prueba lo sujeta.
   */
  it('reenvía al servicio el usuario del token, que es quien recibirá la notificación', async () => {
    process.env.ENV = 'DEV';

    await controller.seedSimulacionVacunacion('2026-08-01', '2026-08-07', usuario);

    expect(service.seedSimulacionVacunacionDiaria).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      usuario,
    );
  });
});
