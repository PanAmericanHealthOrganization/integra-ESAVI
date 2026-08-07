import { Test, TestingModule } from '@nestjs/testing';
import { IntegradorService } from './integrador.service';
import { PacienteService } from '../service/paciente.service';
import { NotificacionDhis2Service } from '../service/notificacion-dhis2.service';
import { NotificacionVigiflowService } from '../service/notificacion-vigiflow.service';
import { MedicamentoService } from '../service/medicamento.service';
import { AntecedenteEmbarazoService } from '../service/antecedente-embarazo.service';
import { AntecedenteEventoService } from '../service/antecedente-evento.service';
import { AntecedenteMedicoService } from '../service/antecedente-medico.service';
import { AntecedentePreexistenciaService } from '../service/antecedente-preexistencia.service';
import { CausalidadEsaviService } from '../service/causalidad-esavi.service';
import { DesenlaceEsaviService } from '../service/desenlace-esavi.service';
import { EmbarazoEsaviService } from '../service/embarazo-esavi.service';
import { GravedadEsaviService } from '../service/gravedad-esavi.service';
import { DatoVacunaService } from '../service/dato-vacuna.service';
import { DatoVacunacionService } from '../service/dato-vacunacion.service';
import { DatoEsaviService } from '../service/dato-esavi.service';
import { InvestigacionService } from '../service/investigacion.service';
import { SourceEnum } from '../enum/source-enum';

const mockPacienteService = {
  createFromDhis2: jest.fn(),
  createFromVigiflow: jest.fn(),
};
const mockNotificacionDhis2Service = {
  create: jest.fn(),
  findByCodeDhis2: jest.fn(),
  findByIdentificacionAndDateRange: jest.fn(),
  findSimilarRecords: jest.fn(),
  update: jest.fn(),
};
const mockNotificacionVigiflowService = { create: jest.fn() };
const mockMedicamentoService = { createOneToMany: jest.fn() };
const mockAntecedenteEmbarazoService = { create: jest.fn() };
const mockAntecedenteEventoService = { create: jest.fn() };
const mockAntecedenteMedicoService = { create: jest.fn() };
const mockAntecedentePreexistenciaService = { create: jest.fn() };
const mockCausalidadEsaviService = { create: jest.fn() };
const mockDesenlaceEsaviService = { create: jest.fn() };
const mockEmbarazoEsaviService = { create: jest.fn() };
const mockGravedadEsaviService = { create: jest.fn() };
const mockDatoVacunaService = { create: jest.fn(), createByNotificacion: jest.fn() };
const mockDatoVacunacionService = { create: jest.fn() };
const mockDatoEsaviService = { create: jest.fn() };
const mockInvestigacionService = { create: jest.fn() };

describe('IntegradorService', () => {
  let service: IntegradorService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegradorService,
        { provide: PacienteService, useValue: mockPacienteService },
        { provide: NotificacionDhis2Service, useValue: mockNotificacionDhis2Service },
        { provide: NotificacionVigiflowService, useValue: mockNotificacionVigiflowService },
        { provide: MedicamentoService, useValue: mockMedicamentoService },
        { provide: AntecedenteEmbarazoService, useValue: mockAntecedenteEmbarazoService },
        { provide: AntecedenteEventoService, useValue: mockAntecedenteEventoService },
        { provide: AntecedenteMedicoService, useValue: mockAntecedenteMedicoService },
        { provide: AntecedentePreexistenciaService, useValue: mockAntecedentePreexistenciaService },
        { provide: CausalidadEsaviService, useValue: mockCausalidadEsaviService },
        { provide: DesenlaceEsaviService, useValue: mockDesenlaceEsaviService },
        { provide: EmbarazoEsaviService, useValue: mockEmbarazoEsaviService },
        { provide: GravedadEsaviService, useValue: mockGravedadEsaviService },
        { provide: DatoVacunaService, useValue: mockDatoVacunaService },
        { provide: DatoVacunacionService, useValue: mockDatoVacunacionService },
        { provide: DatoEsaviService, useValue: mockDatoEsaviService },
        { provide: InvestigacionService, useValue: mockInvestigacionService },
      ],
    }).compile();

    service = module.get<IntegradorService>(IntegradorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('crea desde DHIS2 y procesa sub-entidades cuando hay paciente', async () => {
      const paciente = { id: 'p1' };
      const notificacion = { id: 'n1' };
      mockPacienteService.createFromDhis2.mockResolvedValue(paciente);
      mockNotificacionDhis2Service.create.mockResolvedValue(notificacion);
      mockMedicamentoService.createOneToMany.mockResolvedValue(undefined);

      await service.create({
        source: SourceEnum.DHIS2,
        pacienteDhis2: {},
        notificacion: {},
        medicamento: [{ nombre: 'med1' }],
      } as any);

      expect(mockPacienteService.createFromDhis2).toHaveBeenCalledWith({});
      expect(mockNotificacionDhis2Service.create).toHaveBeenCalledWith({}, paciente);
      expect(mockMedicamentoService.createOneToMany).toHaveBeenCalledWith(notificacion, [{ nombre: 'med1' }]);
    });

    it('no crea notificación DHIS2 si no se pudo crear el paciente', async () => {
      mockPacienteService.createFromDhis2.mockResolvedValue(null);

      await service.create({ source: SourceEnum.DHIS2, pacienteDhis2: {}, notificacion: {} } as any);

      expect(mockNotificacionDhis2Service.create).not.toHaveBeenCalled();
    });

    it('crea desde VigiFlow (source distinto de DHIS2) y procesa sub-entidades', async () => {
      const paciente = { id: 'p1' };
      const notificacion = { id: 'n1' };
      mockPacienteService.createFromVigiflow.mockResolvedValue(paciente);
      mockNotificacionVigiflowService.create.mockResolvedValue(notificacion);
      mockAntecedenteEventoService.create.mockResolvedValue(undefined);

      await service.create({
        source: SourceEnum.VIGIFLOW,
        pacienteVigiflow: {},
        notificacion: {},
        antecedenteEvento: { detalle: 'x' },
      } as any);

      expect(mockPacienteService.createFromVigiflow).toHaveBeenCalledWith({}, undefined);
      expect(mockNotificacionVigiflowService.create).toHaveBeenCalledWith({}, paciente, undefined);
      expect(mockAntecedenteEventoService.create).toHaveBeenCalledWith(notificacion, { detalle: 'x' });
    });

    it('procesa datoVacunacion y datoVacuna encadenados (usa datoVacunacion creado)', async () => {
      const paciente = { id: 'p1' };
      const notificacion = { id: 'n1' };
      const datoVacunacion = { id: 'dv1' };
      mockPacienteService.createFromVigiflow.mockResolvedValue(paciente);
      mockNotificacionVigiflowService.create.mockResolvedValue(notificacion);
      mockDatoVacunacionService.create.mockResolvedValue(datoVacunacion);

      await service.create({
        source: SourceEnum.VIGIFLOW,
        pacienteVigiflow: {},
        notificacion: {},
        datoVacunacion: { fecha: '2024-01-01' },
        datoVacuna: [{ nombre: 'vac1' }],
      } as any);

      expect(mockDatoVacunacionService.create).toHaveBeenCalledWith(notificacion, { fecha: '2024-01-01' });
      expect(mockDatoVacunaService.create).toHaveBeenCalledWith(datoVacunacion, [{ nombre: 'vac1' }]);
      expect(mockDatoVacunaService.createByNotificacion).not.toHaveBeenCalled();
    });

    it('usa createByNotificacion para datoVacuna cuando no hay datoVacunacion explícito', async () => {
      const paciente = { id: 'p1' };
      const notificacion = { id: 'n1' };
      mockPacienteService.createFromVigiflow.mockResolvedValue(paciente);
      mockNotificacionVigiflowService.create.mockResolvedValue(notificacion);

      await service.create({
        source: SourceEnum.VIGIFLOW,
        pacienteVigiflow: {},
        notificacion: {},
        datoVacuna: [{ nombre: 'vac1' }],
      } as any);

      expect(mockDatoVacunaService.createByNotificacion).toHaveBeenCalledWith(notificacion, [{ nombre: 'vac1' }]);
    });

    it('acumula errores de sub-entidades aisladas y lanza uno solo al final', async () => {
      const paciente = { id: 'p1' };
      const notificacion = { id: 'n1' };
      mockPacienteService.createFromVigiflow.mockResolvedValue(paciente);
      mockNotificacionVigiflowService.create.mockResolvedValue(notificacion);
      mockAntecedenteEventoService.create.mockRejectedValue(new Error('formato inválido'));
      mockAntecedenteMedicoService.create.mockResolvedValue(undefined);

      await expect(
        service.create({
          source: SourceEnum.VIGIFLOW,
          pacienteVigiflow: {},
          notificacion: {},
          antecedenteEvento: { detalle: 'x' },
          antecedenteMedico: { detalle: 'y' },
        } as any),
      ).rejects.toThrow(/Fallaron 1 sub-entidad\(es\)/);

      // el resto de sub-entidades sí se procesan a pesar del error aislado
      expect(mockAntecedenteMedicoService.create).toHaveBeenCalled();
    });

    it('no lanza cuando no hay sub-entidades adicionales en el dto', async () => {
      const paciente = { id: 'p1' };
      const notificacion = { id: 'n1' };
      mockPacienteService.createFromVigiflow.mockResolvedValue(paciente);
      mockNotificacionVigiflowService.create.mockResolvedValue(notificacion);

      await expect(
        service.create({ source: SourceEnum.VIGIFLOW, pacienteVigiflow: {}, notificacion: {} } as any),
      ).resolves.toBeUndefined();
    });

    it('procesa investigacion cuando está presente en el dto', async () => {
      const paciente = { id: 'p1' };
      const notificacion = { id: 'n1' };
      mockPacienteService.createFromVigiflow.mockResolvedValue(paciente);
      mockNotificacionVigiflowService.create.mockResolvedValue(notificacion);
      mockInvestigacionService.create.mockResolvedValue(undefined);

      await service.create({
        source: SourceEnum.VIGIFLOW,
        pacienteVigiflow: {},
        notificacion: {},
        investigacion: { detalle: 'inv' },
      } as any);

      expect(mockInvestigacionService.create).toHaveBeenCalledWith({ detalle: 'inv' }, notificacion);
    });
  });

  // ─── findByCodigoDhis2Evento / findByIdentificacionAndDateRange / findSimilarRecords ─

  describe('delegaciones de búsqueda', () => {
    it('findByCodigoDhis2Evento delega en NotificacionDhis2Service', async () => {
      mockNotificacionDhis2Service.findByCodeDhis2.mockResolvedValue({ id: 'n1' });
      const result = await service.findByCodigoDhis2Evento('EVT-1');
      expect(mockNotificacionDhis2Service.findByCodeDhis2).toHaveBeenCalledWith('EVT-1');
      expect(result).toEqual({ id: 'n1' });
    });

    it('findByIdentificacionAndDateRange delega en NotificacionDhis2Service', async () => {
      const fi = new Date('2024-01-01');
      const ff = new Date('2024-02-01');
      mockNotificacionDhis2Service.findByIdentificacionAndDateRange.mockResolvedValue([]);
      const result = await service.findByIdentificacionAndDateRange('0102030405', fi, ff);
      expect(mockNotificacionDhis2Service.findByIdentificacionAndDateRange).toHaveBeenCalledWith(
        '0102030405',
        fi,
        ff,
      );
      expect(result).toEqual([]);
    });

    it('findSimilarRecords delega en NotificacionDhis2Service', async () => {
      mockNotificacionDhis2Service.findSimilarRecords.mockResolvedValue([{ id: 'n2' }]);
      const result = await service.findSimilarRecords('0102030405', '2024-01-01');
      expect(mockNotificacionDhis2Service.findSimilarRecords).toHaveBeenCalledWith('0102030405', '2024-01-01');
      expect(result).toEqual([{ id: 'n2' }]);
    });
  });

  // ─── updateByCodigoDhis2Evento ────────────────────────────────────────────

  describe('updateByCodigoDhis2Evento', () => {
    it('lanza error si la notificación no existe', async () => {
      mockNotificacionDhis2Service.findByCodeDhis2.mockResolvedValue(null);

      await expect(service.updateByCodigoDhis2Evento('EVT-NO-EXISTE', {} as any)).rejects.toThrow(
        'Notificación con código DHIS2 EVT-NO-EXISTE no encontrada',
      );
    });

    it('actualiza la notificación existente y reprocesa sub-entidades', async () => {
      const notificacionExistente = { id: 'n1' };
      const paciente = { id: 'p1' };
      const notificacionActualizada = { id: 'n1', edad: 30 };
      mockNotificacionDhis2Service.findByCodeDhis2.mockResolvedValue(notificacionExistente);
      mockPacienteService.createFromDhis2.mockResolvedValue(paciente);
      mockNotificacionDhis2Service.update.mockResolvedValue(notificacionActualizada);
      mockMedicamentoService.createOneToMany.mockResolvedValue(undefined);

      const result = await service.updateByCodigoDhis2Evento('EVT-1', {
        pacienteDhis2: {},
        notificacion: {},
        medicamento: [{ nombre: 'med1' }],
      } as any);

      expect(mockNotificacionDhis2Service.update).toHaveBeenCalledWith(notificacionExistente, {}, paciente);
      expect(mockMedicamentoService.createOneToMany).toHaveBeenCalledWith(notificacionActualizada, [
        { nombre: 'med1' },
      ]);
      expect(result).toEqual(notificacionActualizada);
    });

    it('no reprocesa sub-entidades si update no retorna notificación', async () => {
      const notificacionExistente = { id: 'n1' };
      mockNotificacionDhis2Service.findByCodeDhis2.mockResolvedValue(notificacionExistente);
      mockPacienteService.createFromDhis2.mockResolvedValue({ id: 'p1' });
      mockNotificacionDhis2Service.update.mockResolvedValue(null);

      const result = await service.updateByCodigoDhis2Evento('EVT-1', { pacienteDhis2: {}, notificacion: {} } as any);

      expect(mockMedicamentoService.createOneToMany).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
