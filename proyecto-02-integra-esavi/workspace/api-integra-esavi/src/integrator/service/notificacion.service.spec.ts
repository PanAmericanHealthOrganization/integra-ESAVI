import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificacionService } from './notificacion.service';
import { Notificacion } from '../entity/notificacion.entity';
import { MedicamentoService } from './medicamento.service';
import { AntecedenteMedicoService } from './antecedente-medico.service';
import { AntecedenteEmbarazoService } from './antecedente-embarazo.service';
import { AntecedenteEventoService } from './antecedente-evento.service';
import { AntecedentePreexistenciaService } from './antecedente-preexistencia.service';

const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
};

const mockNotificacionRepo = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

const mockMedicamentoService = {
  findMedicinaByNotificacionUUID: jest.fn(),
  findOneBelongingToNotificacion: jest.fn(),
};
const mockAntecedenteMedicoService = { findAntecedenteMedicoByNotificacionUUID: jest.fn() };
const mockAntecedenteEmbarazoService = { findAntecedenteEmbarazoByNotificacionUUID: jest.fn() };
const mockAntecedenteEventoService = { findAntecedenteEventoByNotificacionUUID: jest.fn() };
const mockAntecedentePreexistenciaService = { findAntecedentePreexistenciaByNotificacionUUID: jest.fn() };

describe('NotificacionService', () => {
  let service: NotificacionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificacionService,
        { provide: getRepositoryToken(Notificacion, 'POSTGRES_INTEGRATOR_DS'), useValue: mockNotificacionRepo },
        { provide: MedicamentoService, useValue: mockMedicamentoService },
        { provide: AntecedenteMedicoService, useValue: mockAntecedenteMedicoService },
        { provide: AntecedenteEmbarazoService, useValue: mockAntecedenteEmbarazoService },
        { provide: AntecedenteEventoService, useValue: mockAntecedenteEventoService },
        { provide: AntecedentePreexistenciaService, useValue: mockAntecedentePreexistenciaService },
      ],
    }).compile();
    service = module.get<NotificacionService>(NotificacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('crea la notificacion asociada al paciente y la guarda', async () => {
      mockNotificacionRepo.save.mockResolvedValue({ id: 'n1' });
      const paciente = { id: 'p1' } as any;

      const result = await service.create({ codigoOrigenNotificacion: 'X' } as any, paciente);

      expect(mockNotificacionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ paciente }),
      );
      expect(result).toEqual({ id: 'n1' });
    });
  });

  describe('delete', () => {
    it('retorna undefined (no implementado)', async () => {
      const result = await service.delete('n1');
      expect(result).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('busca con relaciones paciente y sexo', async () => {
      mockNotificacionRepo.find.mockResolvedValue([{ id: 'n1' }]);
      const result = await service.findAll();
      expect(mockNotificacionRepo.find).toHaveBeenCalledWith({
        relations: ['paciente', 'paciente.sexo'],
      });
      expect(result).toEqual([{ id: 'n1' }]);
    });
  });

  describe('findOne', () => {
    it('retorna la notificacion con relaciones por defecto', async () => {
      mockNotificacionRepo.findOne.mockResolvedValue({ id: 'n1' });
      const result = await service.findOne('n1');
      expect(mockNotificacionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'n1' },
        relations: ['establecimiento', 'tipoReporte', 'tipoEmisor'],
      });
      expect(result).toEqual({ id: 'n1' });
    });

    it('agrega relaciones adicionales sin duplicar las por defecto', async () => {
      mockNotificacionRepo.findOne.mockResolvedValue({ id: 'n1' });
      await service.findOne('n1', 'paciente,tipoReporte,paciente.sexo');
      expect(mockNotificacionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'n1' },
        relations: ['establecimiento', 'tipoReporte', 'tipoEmisor', 'paciente', 'paciente.sexo'],
      });
    });

    it('lanza EntityNotFoundException cuando no existe', async () => {
      mockNotificacionRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('NOEXISTE')).rejects.toThrow();
    });
  });

  describe('delegaciones a servicios colaboradores', () => {
    it('findMedicinaByNotificacionUUID delega en MedicamentoService', async () => {
      mockMedicamentoService.findMedicinaByNotificacionUUID.mockResolvedValue([{ id: 'm1' }]);
      const result = await service.findMedicinaByNotificacionUUID('n1');
      expect(mockMedicamentoService.findMedicinaByNotificacionUUID).toHaveBeenCalledWith('n1');
      expect(result).toEqual([{ id: 'm1' }]);
    });

    it('findMedicinaByUUIDBelongingToNotificacion delega en MedicamentoService', async () => {
      mockMedicamentoService.findOneBelongingToNotificacion.mockResolvedValue({ id: 'm1' });
      const result = await service.findMedicinaByUUIDBelongingToNotificacion('n1', 'm1');
      expect(mockMedicamentoService.findOneBelongingToNotificacion).toHaveBeenCalledWith('n1', 'm1');
      expect(result).toEqual({ id: 'm1' });
    });

    it('findAntecedenteEmbarazoByNotificacionUUID delega en AntecedenteEmbarazoService', async () => {
      mockAntecedenteEmbarazoService.findAntecedenteEmbarazoByNotificacionUUID.mockResolvedValue({ id: 'a1' });
      const result = await service.findAntecedenteEmbarazoByNotificacionUUID('n1');
      expect(mockAntecedenteEmbarazoService.findAntecedenteEmbarazoByNotificacionUUID).toHaveBeenCalledWith('n1');
      expect(result).toEqual({ id: 'a1' });
    });

    it('findAntecedenteMedicoByNotificacionUUID delega en AntecedenteMedicoService', async () => {
      mockAntecedenteMedicoService.findAntecedenteMedicoByNotificacionUUID.mockResolvedValue({ id: 'a2' });
      const result = await service.findAntecedenteMedicoByNotificacionUUID('n1');
      expect(mockAntecedenteMedicoService.findAntecedenteMedicoByNotificacionUUID).toHaveBeenCalledWith('n1');
      expect(result).toEqual({ id: 'a2' });
    });

    it('findAntecedenteEventoByNotificacionUUID delega en AntecedenteEventoService', async () => {
      mockAntecedenteEventoService.findAntecedenteEventoByNotificacionUUID.mockResolvedValue({ id: 'a3' });
      const result = await service.findAntecedenteEventoByNotificacionUUID('n1');
      expect(mockAntecedenteEventoService.findAntecedenteEventoByNotificacionUUID).toHaveBeenCalledWith('n1');
      expect(result).toEqual({ id: 'a3' });
    });

    it('findAntecedentePreexistenciaByNotificacionUUID delega en AntecedentePreexistenciaService', async () => {
      mockAntecedentePreexistenciaService.findAntecedentePreexistenciaByNotificacionUUID.mockResolvedValue({ id: 'a4' });
      const result = await service.findAntecedentePreexistenciaByNotificacionUUID('n1');
      expect(mockAntecedentePreexistenciaService.findAntecedentePreexistenciaByNotificacionUUID).toHaveBeenCalledWith('n1');
      expect(result).toEqual({ id: 'a4' });
    });
  });

  describe('findAllPaginated', () => {
    it('usa página y límite por defecto cuando no vienen en el request', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: 'n1' }], 1]);

      const result = await service.findAllPaginated({
        pagination: {},
        filter: null,
        sort: null,
      } as any);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('notificacion.fechaNotificacion', 'DESC');
      expect(result).toEqual({ data: [{ id: 'n1' }], total: 1, page: 1, limit: 10, totalPages: 1 });
    });

    it('aplica todos los filtros dinámicos soportados', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAllPaginated({
        pagination: { page: '2', perPage: '5' },
        filter: {
          fechaDesde: '2021-01-01',
          fechaHasta: '2021-12-31',
          identificacion: '123',
          codigoOrigenNotificacion: 'ABC',
          origen: 'DHIS2',
          gravedad: 'GRAVE',
          otroCampo: 'valor',
          vacio: '',
          nulo: null,
        },
        sort: null,
      } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'notificacion.fechaNotificacion >= :fechaDesde',
        { fechaDesde: '2021-01-01' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'notificacion.fechaNotificacion <= :fechaHasta',
        { fechaHasta: '2021-12-31' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'UPPER(paciente.identificacion) LIKE UPPER(:identificacion)',
        { identificacion: '%123%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'UPPER(notificacion.codigoOrigenNotificacion) LIKE UPPER(:codigoOrigenNotificacion)',
        { codigoOrigenNotificacion: '%ABC%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notificacion.origen = :origen', {
        origen: 'DHIS2',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('gravedad.tipo = :gravedad', {
        gravedad: 'GRAVE',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notificacion.otroCampo = :otroCampo', {
        otroCampo: 'valor',
      });
    });

    it('aplica ordenamiento múltiple cuando params.sort es un arreglo', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAllPaginated({
        pagination: { page: 1, perPage: 10 },
        filter: {},
        sort: [
          { field: 'fechaNotificacion', order: 'DESC' },
          { field: 'codigoOrigenNotificacion', order: 'ASC' },
        ],
      } as any);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('notificacion.fechaNotificacion', 'DESC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('notificacion.codigoOrigenNotificacion', 'ASC');
    });
  });
});
