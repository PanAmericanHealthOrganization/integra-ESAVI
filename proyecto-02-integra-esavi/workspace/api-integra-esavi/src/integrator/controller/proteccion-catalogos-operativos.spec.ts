import {GUARDS_METADATA} from '@nestjs/common/constants';
import {Reflector} from '@nestjs/core';
import {ROLES_KEY} from '../../common/decorators/roles.decorator';
import {KeycloakAuthGuard} from '../../common/guards/keycloak-auth.guard';
import {RolesGuard} from '../../common/guards/roles.guard';
import {CantonController} from './canton.controller';
import {CatalogoPadreController} from './catalogo-padre.controller';
import {EstablecimientoController} from './establecimiento.controller';
import {GacetaController} from './gaceta.controller';
import {ParroquiaController} from './parroquia.controller';
import {ProvinciaController} from './provincia.controller';
import {SyncController} from './sync.controller';
import {VacunometroController} from './vacunometro.controller';

/**
 * Catálogos, división político-administrativa y controladores operativos.
 *
 * Reparto: leer exige token —los catálogos alimentan selects que abre cualquier usuario—,
 * escribir exige `admin`. Varios de estos ya declaraban `@ApiBearerAuth` en Swagger sin
 * exigirlo de verdad; ahora la documentación y el comportamiento coinciden.
 */
describe('Protección de catálogos, territorio y operativos', () => {
  const reflector = new Reflector();

  const rolesDe = (controlador: any, metodo: string): string[] | undefined =>
    reflector.getAllAndOverride<string[]>(ROLES_KEY, [controlador.prototype[metodo], controlador]);

  const guardsDe = (controlador: any): any[] =>
    Reflect.getMetadata(GUARDS_METADATA, controlador) ?? [];

  /** [nombre, controlador, lecturas, escrituras que exigen admin] */
  const casos: [string, any, string[], string[]][] = [
    [
      'EstablecimientoController',
      EstablecimientoController,
      ['findAll', 'findOne'],
      ['create', 'update', 'delete'],
    ],
    [
      'CatalogoPadreController',
      CatalogoPadreController,
      ['findAll', 'findOne'],
      ['create', 'update', 'delete'],
    ],
    ['ProvinciaController', ProvinciaController, ['findAll', 'findOne'], ['create', 'update', 'delete']],
    ['CantonController', CantonController, ['findAll', 'findOne'], ['create', 'update', 'delete']],
    ['ParroquiaController', ParroquiaController, ['findAll', 'findOne'], ['create', 'update', 'delete']],
    [
      'SyncController',
      SyncController,
      // getPaginated usa POST sólo para mandar filtros en el cuerpo: es lectura.
      ['getMany', 'list', 'getOne', 'getPaginated'],
      ['create', 'update', 'delete'],
    ],
    [
      'VacunometroController',
      VacunometroController,
      ['getOne', 'getMany', 'getPaginated'],
      ['create', 'update', 'delete'],
    ],
    [
      'GacetaController',
      GacetaController,
      ['getPdfInforme', 'getOne', 'getMany', 'getPaginated', 'findAll', 'findByPeriodo', 'findByEstado'],
      ['create', 'update', 'delete'],
    ],
  ];

  describe.each(casos)('%s', (_nombre, controlador, lecturas, escrituras) => {
    it('exige token de Keycloak y declara los guards en orden', () => {
      const guards = guardsDe(controlador);

      expect(guards).toContain(KeycloakAuthGuard);
      expect(guards).toContain(RolesGuard);
      // RolesGuard lee request.user, que deja KeycloakAuthGuard.
      expect(guards.indexOf(KeycloakAuthGuard)).toBeLessThan(guards.indexOf(RolesGuard));
    });

    it('no restringe la clase entera a un rol', () => {
      expect(Reflect.getMetadata(ROLES_KEY, controlador)).toBeUndefined();
    });

    it.each(escrituras)('la escritura %s exige rol admin', (metodo) => {
      expect(rolesDe(controlador, metodo)).toEqual(['admin']);
    });

    it.each(lecturas)('la lectura %s se conforma con autenticarse', (metodo) => {
      expect(rolesDe(controlador, metodo)).toBeUndefined();
    });
  });

  it('cubre todos los manejadores de cada controlador', () => {
    // Si alguien agrega un endpoint y no lo clasifica aquí, esta prueba lo delata.
    const sinClasificar = casos.flatMap(([nombre, controlador, lecturas, escrituras]) => {
      const declarados = new Set([...lecturas, ...escrituras]);
      return Object.getOwnPropertyNames(controlador.prototype)
        .filter((m) => m !== 'constructor' && !declarados.has(m))
        .map((m) => `${nombre}.${m}`);
    });

    expect(sinClasificar).toEqual([]);
  });
});
