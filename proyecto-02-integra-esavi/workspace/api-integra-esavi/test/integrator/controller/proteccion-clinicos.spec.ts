import {GUARDS_METADATA} from '@nestjs/common/constants';
import {Reflector} from '@nestjs/core';
import {ROLES_KEY} from 'src/common/decorators/roles.decorator';
import {KeycloakAuthGuard} from 'src/common/guards/keycloak-auth.guard';
import {RolesGuard} from 'src/common/guards/roles.guard';
import {AntecedenteEmbarazoController} from 'src/integrator/controller/antecedente-embarazo.controller';
import {AntecedenteEventoController} from 'src/integrator/controller/antecedente-evento.controller';
import {AntecedenteMedicoController} from 'src/integrator/controller/antecedente-medico.controller';
import {AntecedentePreexistenciaController} from 'src/integrator/controller/antecedente-preexistencia.controller';
import {DatoEsaviController} from 'src/integrator/controller/dato-esavi.controller';
import {DesenlaceEsaviController} from 'src/integrator/controller/desenlace-esavi.controller';
import {InvestigacionController} from 'src/integrator/controller/investigacion.controller';
import {NotificacionController} from 'src/integrator/controller/notificacion.controller';
import {PacienteDhis2Controller} from 'src/integrator/controller/paciente-dhis2.controller';
import {PacienteVigiflowController} from 'src/integrator/controller/paciente-vigiflow.controller';
import {PacienteController} from 'src/integrator/controller/paciente.controller';

/**
 * Protección de los controladores que exponen historia clínica y datos personales de
 * pacientes. Todos llevaban el comentario "CRUD PARA MICROSERVICIOS" y ninguno exigía
 * credenciales: sus `findAll` devolvían el universo completo sin filtrar ni paginar.
 *
 * El criterio, fijado aquí para que no se diluya: leer exige token porque la ficha del ESAVI
 * la consulta cualquier usuario autenticado; escribir exige además rol `admin` porque altera
 * el expediente de un caso.
 */
describe('Protección de los controladores clínicos y de pacientes', () => {
  const reflector = new Reflector();

  const rolesDe = (controlador: any, metodo: string): string[] | undefined =>
    reflector.getAllAndOverride<string[]>(ROLES_KEY, [controlador.prototype[metodo], controlador]);

  const guardsDe = (controlador: any): any[] =>
    Reflect.getMetadata(GUARDS_METADATA, controlador) ?? [];

  /** [controlador, lecturas, escrituras que exigen admin] */
  const casos: [string, any, string[], string[]][] = [
    [
      'NotificacionController',
      NotificacionController,
      [
        'findAll',
        'findOne',
        'findAllPaginated',
        'findDatoEsaviByUUID',
        'findDatoVacunaByUUID',
        'findDatoVacunacionByUUID',
        'findGravedadEsaviByUUID',
        'findDesenlaceEsaviByUUID',
        'searchAntecedenteEmbarazoByUUID',
      ],
      [],
    ],
    ['PacienteController', PacienteController, ['findAll', 'findOne'], []],
    ['DatoEsaviController', DatoEsaviController, ['findAll', 'findOne'], ['update']],
    ['DesenlaceEsaviController', DesenlaceEsaviController, ['findAll', 'findOne'], ['update']],
    [
      'AntecedenteEmbarazoController',
      AntecedenteEmbarazoController,
      ['findAll', 'findOne'],
      ['create', 'update'],
    ],
    ['AntecedenteEventoController', AntecedenteEventoController, ['findAll', 'findOne'], ['update']],
    ['AntecedenteMedicoController', AntecedenteMedicoController, ['findAll', 'findOne'], ['update']],
    [
      'AntecedentePreexistenciaController',
      AntecedentePreexistenciaController,
      ['findAll', 'findOne'],
      ['update'],
    ],
    [
      'InvestigacionController',
      InvestigacionController,
      // getMany y getPaginated usan POST sólo para mandar filtros en el cuerpo: son lectura.
      ['getOne', 'getMany', 'getPaginated'],
      ['create', 'update', 'delete'],
    ],
    [
      'PacienteDhis2Controller',
      PacienteDhis2Controller,
      // Sin consumidor conocido y con PII de por medio: admin para todo, lectura incluida.
      [],
      ['findAll', 'findOne', 'create', 'update'],
    ],
    ['PacienteVigiflowController', PacienteVigiflowController, [], ['findAll', 'findOne', 'create', 'update']],
  ];

  describe.each(casos)('%s', (_nombre, controlador, lecturas, escrituras) => {
    it('exige token de Keycloak', () => {
      expect(guardsDe(controlador)).toContain(KeycloakAuthGuard);
    });

    it('declara RolesGuard después de KeycloakAuthGuard si usa roles', () => {
      const guards = guardsDe(controlador);
      if (!guards.includes(RolesGuard)) {
        // Controlador de sólo lectura: no necesita RolesGuard.
        expect(escrituras).toHaveLength(0);
        return;
      }
      // RolesGuard lee request.user, que deja KeycloakAuthGuard.
      expect(guards.indexOf(KeycloakAuthGuard)).toBeLessThan(guards.indexOf(RolesGuard));
    });

    if (escrituras.length) {
      it.each(escrituras)('la escritura %s exige rol admin', (metodo) => {
        expect(rolesDe(controlador, metodo)).toEqual(['admin']);
      });
    }

    if (lecturas.length) {
      it.each(lecturas)('la lectura %s se conforma con autenticarse', (metodo) => {
        expect(rolesDe(controlador, metodo)).toBeUndefined();
      });
    }
  });

  it('ninguno de los once quedó sin guard', () => {
    const sinGuard = casos
      .filter(([, controlador]) => guardsDe(controlador).length === 0)
      .map(([nombre]) => nombre);

    expect(sinGuard).toEqual([]);
  });
});
