import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakAuthGuard } from '../../common/guards/keycloak-auth.guard';
import { NotificacionController } from './notificacion.controller';
import { NotificacionService } from '../service/notificacion.service';
import { DatoVacunacionService } from '../service/dato-vacunacion.service';
import { DatoVacunaService } from '../service/dato-vacuna.service';
import { DatoEsaviService } from '../service/dato-esavi.service';
import { DesenlaceEsaviService } from '../service/desenlace-esavi.service';
import { EmbarazoEsaviService } from '../service/embarazo-esavi.service';
import { GravedadEsaviService } from '../service/gravedad-esavi.service';

const mockNotificacionService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findMedicinaByNotificacionUUID: jest.fn(),
  findMedicinaByUUIDBelongingToNotificacion: jest.fn(),
  findAntecedenteEmbarazoByNotificacionUUID: jest.fn(),
  findAntecedenteEventoByNotificacionUUID: jest.fn(),
  findAntecedenteMedicoByNotificacionUUID: jest.fn(),
  findAntecedentePreexistenciaByNotificacionUUID: jest.fn(),
  findAllPaginated: jest.fn(),
};

const mockDatoVacunacionService = { findByNotificacionId: jest.fn() };
const mockDatoVacunaService = { findByNotificacionId: jest.fn() };
const mockDatoEsaviService = { findByNotificacionId: jest.fn() };
const mockEmbarazoEsaviService = { findByNotificacionUUID: jest.fn() };
const mockDesenlaceEsaviService = { findByNotificacionId: jest.fn() };
const mockGravedadEsaviService = { findByNotificacionId: jest.fn() };

// UUID válido para pasar el ParseUUIDPipe cuando el controller se prueba vía módulo (aquí se llama directo, no aplica).
const UUID = '11111111-1111-1111-1111-111111111111';

describe('NotificacionController', () => {
  let controller: NotificacionController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificacionController],
      providers: [
        { provide: NotificacionService, useValue: mockNotificacionService },
        { provide: DatoVacunacionService, useValue: mockDatoVacunacionService },
        { provide: DatoVacunaService, useValue: mockDatoVacunaService },
        { provide: DatoEsaviService, useValue: mockDatoEsaviService },
        { provide: EmbarazoEsaviService, useValue: mockEmbarazoEsaviService },
        { provide: DesenlaceEsaviService, useValue: mockDesenlaceEsaviService },
        { provide: GravedadEsaviService, useValue: mockGravedadEsaviService },
      ],
    })
      // El controlador exige token de Keycloak. Estas pruebas ejercitan la delegación en los
      // servicios, no la autenticación (que se cubre en proteccion-clinicos.spec.ts), así que
      // se reemplaza el guard: instanciarlo de verdad exigiría un ConfigService y descargar
      // las claves JWKS.
      .overrideGuard(KeycloakAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get<NotificacionController>(NotificacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('delega en notificacionService.findAll', () => {
      mockNotificacionService.findAll.mockReturnValue([{ id: 'n1' }]);
      const result = controller.findAll();
      expect(mockNotificacionService.findAll).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'n1' }]);
    });
  });

  describe('findOne', () => {
    it('delega en notificacionService.findOne sin relación', () => {
      mockNotificacionService.findOne.mockReturnValue({ id: UUID });
      const result = controller.findOne(UUID, undefined);
      expect(mockNotificacionService.findOne).toHaveBeenCalledWith(UUID, undefined);
      expect(result).toEqual({ id: UUID });
    });

    it('delega en notificacionService.findOne con relaciones válidas', () => {
      mockNotificacionService.findOne.mockReturnValue({ id: UUID });
      controller.findOne(UUID, 'paciente,tipoReporte');
      expect(mockNotificacionService.findOne).toHaveBeenCalledWith(UUID, 'paciente,tipoReporte');
    });

    it('lanza BadRequestException si alguna relación no es válida', () => {
      expect(() => controller.findOne(UUID, 'paciente,relacionInvalida')).toThrow(
        BadRequestException,
      );
      expect(mockNotificacionService.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findMedicinaByNotificacionUUID', () => {
    it('delega en notificacionService', () => {
      mockNotificacionService.findMedicinaByNotificacionUUID.mockReturnValue([{ id: 'm1' }]);
      const result = controller.findMedicinaByNotificacionUUID(UUID);
      expect(mockNotificacionService.findMedicinaByNotificacionUUID).toHaveBeenCalledWith(UUID);
      expect(result).toEqual([{ id: 'm1' }]);
    });
  });

  describe('searchMedicinaByUUID', () => {
    it('delega en notificacionService con ambos uuids', () => {
      mockNotificacionService.findMedicinaByUUIDBelongingToNotificacion.mockReturnValue({ id: 'm1' });
      const result = controller.searchMedicinaByUUID(UUID, UUID);
      expect(mockNotificacionService.findMedicinaByUUIDBelongingToNotificacion).toHaveBeenCalledWith(UUID, UUID);
      expect(result).toEqual({ id: 'm1' });
    });
  });

  describe('searchAntecedenteEmbarazoByUUID', () => {
    it('delega en notificacionService', () => {
      mockNotificacionService.findAntecedenteEmbarazoByNotificacionUUID.mockReturnValue({ id: 'a1' });
      const result = controller.searchAntecedenteEmbarazoByUUID(UUID);
      expect(mockNotificacionService.findAntecedenteEmbarazoByNotificacionUUID).toHaveBeenCalledWith(UUID);
      expect(result).toEqual({ id: 'a1' });
    });
  });

  describe('searchAntecedenteEventoByUUID', () => {
    it('delega en notificacionService', () => {
      mockNotificacionService.findAntecedenteEventoByNotificacionUUID.mockReturnValue({ id: 'a2' });
      const result = controller.searchAntecedenteEventoByUUID(UUID);
      expect(mockNotificacionService.findAntecedenteEventoByNotificacionUUID).toHaveBeenCalledWith(UUID);
      expect(result).toEqual({ id: 'a2' });
    });
  });

  describe('searchAntecedenteMedicoByUUID', () => {
    it('delega en notificacionService', () => {
      mockNotificacionService.findAntecedenteMedicoByNotificacionUUID.mockReturnValue({ id: 'a3' });
      const result = controller.searchAntecedenteMedicoByUUID(UUID);
      expect(mockNotificacionService.findAntecedenteMedicoByNotificacionUUID).toHaveBeenCalledWith(UUID);
      expect(result).toEqual({ id: 'a3' });
    });
  });

  describe('searchAntecedentePreexistenciaByUUID', () => {
    it('delega en notificacionService', () => {
      mockNotificacionService.findAntecedentePreexistenciaByNotificacionUUID.mockReturnValue({ id: 'a4' });
      const result = controller.searchAntecedentePreexistenciaByUUID(UUID);
      expect(mockNotificacionService.findAntecedentePreexistenciaByNotificacionUUID).toHaveBeenCalledWith(UUID);
      expect(result).toEqual({ id: 'a4' });
    });
  });

  describe('findDatoVacunacionByUUID', () => {
    it('delega en datoVacunacionService', () => {
      mockDatoVacunacionService.findByNotificacionId.mockReturnValue([{ id: 'dv1' }]);
      const result = controller.findDatoVacunacionByUUID(UUID);
      expect(mockDatoVacunacionService.findByNotificacionId).toHaveBeenCalledWith(UUID);
      expect(result).toEqual([{ id: 'dv1' }]);
    });
  });

  describe('findDatoVacunaByUUID', () => {
    it('delega en datoVacunaService', () => {
      mockDatoVacunaService.findByNotificacionId.mockReturnValue([{ id: 'dva1' }]);
      const result = controller.findDatoVacunaByUUID(UUID);
      expect(mockDatoVacunaService.findByNotificacionId).toHaveBeenCalledWith(UUID);
      expect(result).toEqual([{ id: 'dva1' }]);
    });
  });

  // findPacienteEmbarazadaByUUID se eliminó junto con TR_PACIENTE_EMBARAZADA: sus dos campos
  // se unificaron en TR_ANTECEDENTES_EMBARAZO y los cubre ya el test de
  // searchAntecedenteEmbarazoByUUID, más arriba.

  describe('findDatoEsaviByUUID', () => {
    it('delega en datoEsaviService', () => {
      mockDatoEsaviService.findByNotificacionId.mockReturnValue([{ id: 'de1' }]);
      const result = controller.findDatoEsaviByUUID(UUID);
      expect(mockDatoEsaviService.findByNotificacionId).toHaveBeenCalledWith(UUID);
      expect(result).toEqual([{ id: 'de1' }]);
    });
  });

  describe('findDesenlaceEsaviByUUID', () => {
    it('delega en desenlaceEsaviService', () => {
      mockDesenlaceEsaviService.findByNotificacionId.mockReturnValue({ id: 'des1', resultadoEvento: 1 });
      const result = controller.findDesenlaceEsaviByUUID(UUID);
      expect(mockDesenlaceEsaviService.findByNotificacionId).toHaveBeenCalledWith(UUID);
      expect(result).toEqual({ id: 'des1', resultadoEvento: 1 });
    });
  });

  describe('findGravedadEsaviByUUID', () => {
    it('delega en gravedadEsaviService', () => {
      mockGravedadEsaviService.findByNotificacionId.mockReturnValue({ id: 'g1', tipo: '1' });
      const result = controller.findGravedadEsaviByUUID(UUID);
      expect(mockGravedadEsaviService.findByNotificacionId).toHaveBeenCalledWith(UUID);
      expect(result).toEqual({ id: 'g1', tipo: '1' });
    });
  });

  describe('findAllPaginated', () => {
    it('delega en notificacionService.findAllPaginated', async () => {
      mockNotificacionService.findAllPaginated.mockResolvedValue({ data: [], total: 0 });
      const body = { pagination: { page: 1, perPage: 10 }, sort: null, filter: {} } as any;
      const result = await controller.findAllPaginated(body);
      expect(mockNotificacionService.findAllPaginated).toHaveBeenCalledWith(body);
      expect(result).toEqual({ data: [], total: 0 });
    });
  });
});
