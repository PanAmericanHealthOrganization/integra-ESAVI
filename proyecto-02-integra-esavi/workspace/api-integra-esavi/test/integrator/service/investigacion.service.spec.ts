import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InvestigacionService } from 'src/integrator/service/investigacion.service';
import { Investigacion } from 'src/integrator/entity/investigacion.entity';

const mockInvestigacionRepo = {
  exist: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

describe('InvestigacionService', () => {
  let service: InvestigacionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestigacionService,
        { provide: getRepositoryToken(Investigacion, 'POSTGRES_INTEGRATOR_DS'), useValue: mockInvestigacionRepo },
      ],
    }).compile();
    service = module.get<InvestigacionService>(InvestigacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exist', () => {
    it('delega en el repositorio', async () => {
      mockInvestigacionRepo.exist.mockResolvedValue(true);
      const result = await service.exist('i1');
      expect(result).toBe(true);
    });
  });

  describe('getOne', () => {
    it('retorna el registro encontrado', async () => {
      mockInvestigacionRepo.findOne.mockResolvedValue({ id: 'i1' });
      const result = await service.getOne('i1');
      expect(result).toEqual({ id: 'i1' });
    });
  });

  describe('getMany', () => {
    it('busca por lista de ids', async () => {
      mockInvestigacionRepo.find.mockResolvedValue([{ id: 'i1' }]);
      const result = await service.getMany({ ids: ['i1'] } as any);
      expect(result).toEqual([{ id: 'i1' }]);
    });
  });

  describe('getPaginated', () => {
    const basePagination = { page: 1, perPage: 10 };

    it('aplica filtros booleanos y usa createdAt por defecto', async () => {
      mockInvestigacionRepo.findAndCount.mockResolvedValue([[{ id: 'i1' }], 1]);

      const result = await service.getPaginated({
        pagination: basePagination,
        sort: null,
        filter: {
          vacunatorioCalidad: true,
          personalCapacitado: false,
          problemaBiologico: true,
          muestraLaboratorio: false,
        },
      } as any);

      expect(mockInvestigacionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            vacunatorioCalidad: true,
            personalCapacitado: false,
            problemaBiologico: true,
            muestraLaboratorio: false,
          },
        }),
      );
      expect(result).toEqual({ data: [{ id: 'i1' }], total: 1 });
    });

    it('usa el campo de orden válido pedido', async () => {
      mockInvestigacionRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.getPaginated({
        pagination: basePagination,
        sort: { field: 'fechaInvestigacion', order: 'ASC' },
        filter: {},
      } as any);
      expect(mockInvestigacionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { fechaInvestigacion: 'ASC' } }),
      );
    });

    it('cae a createdAt si el campo de orden no es válido', async () => {
      mockInvestigacionRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.getPaginated({
        pagination: basePagination,
        sort: { field: 'campoInvalido', order: 'ASC' },
        filter: {},
      } as any);
      expect(mockInvestigacionRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { createdAt: 'ASC' } }),
      );
    });

    it('aplica filtro de fecha con solo año', async () => {
      mockInvestigacionRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.getPaginated({
        pagination: basePagination,
        sort: null,
        filter: { fechaInvestigacion: '2021' },
      } as any);
      const callArgs = mockInvestigacionRepo.findAndCount.mock.calls[0][0];
      expect(callArgs.where.fechaInvestigacion).toBeDefined();
    });

    it('aplica filtro de fecha con año y mes', async () => {
      mockInvestigacionRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.getPaginated({
        pagination: basePagination,
        sort: null,
        filter: { fechaInvestigacion: '2021-05' },
      } as any);
      const callArgs = mockInvestigacionRepo.findAndCount.mock.calls[0][0];
      expect(callArgs.where.fechaInvestigacion).toBeDefined();
    });

    it('aplica filtro de fecha completa', async () => {
      mockInvestigacionRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.getPaginated({
        pagination: basePagination,
        sort: null,
        filter: { fechaInvestigacion: '2021-05-10' },
      } as any);
      const callArgs = mockInvestigacionRepo.findAndCount.mock.calls[0][0];
      expect(callArgs.where.fechaInvestigacion).toBeDefined();
    });

    it('ignora filtro de fecha si no matchea ningún formato', async () => {
      mockInvestigacionRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.getPaginated({
        pagination: basePagination,
        sort: null,
        filter: { fechaInvestigacion: 'no-fecha' },
      } as any);
      const callArgs = mockInvestigacionRepo.findAndCount.mock.calls[0][0];
      expect(callArgs.where).toEqual({});
    });
  });

  describe('create', () => {
    it('crea una nueva investigacion cuando no existe una asociada a la notificacion', async () => {
      mockInvestigacionRepo.findOne.mockResolvedValue(null);
      mockInvestigacionRepo.create.mockImplementation((data) => data);
      mockInvestigacionRepo.save.mockResolvedValue({ id: 'inv1' });

      const notificacion = { id: 'n1' } as any;
      const result = await service.create({ vacunatorioCalidad: true } as any, notificacion);

      expect(mockInvestigacionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ vacunatorioCalidad: true, notificacion }),
      );
      expect(result).toEqual({ id: 'inv1' });
    });

    it('actualiza (upsert) la investigacion existente para la notificacion, ignorando null/undefined', async () => {
      const existing = { id: 'inv1', vacunatorioCalidad: false, personalCapacitado: true };
      mockInvestigacionRepo.findOne.mockResolvedValue(existing);
      mockInvestigacionRepo.save.mockImplementation((data) => Promise.resolve(data));

      const notificacion = { id: 'n1' } as any;
      const result = await service.create(
        { vacunatorioCalidad: true, problemaBiologico: null, muestraLaboratorio: undefined } as any,
        notificacion,
      );

      expect(mockInvestigacionRepo.create).not.toHaveBeenCalled();
      expect(result.vacunatorioCalidad).toBe(true);
      expect(result.personalCapacitado).toBe(true);
      expect(result).not.toHaveProperty('problemaBiologico', null);
    });
  });

  describe('update', () => {
    it('actualiza el registro si existe', async () => {
      mockInvestigacionRepo.findOne
        .mockResolvedValueOnce({ id: 'inv1' })
        .mockResolvedValueOnce({ id: 'inv1', vacunatorioCalidad: true });
      mockInvestigacionRepo.update.mockResolvedValue(undefined);

      const result = await service.update('inv1', { vacunatorioCalidad: true } as any);

      expect(mockInvestigacionRepo.update).toHaveBeenCalledWith('inv1', expect.objectContaining({ vacunatorioCalidad: true }));
      expect(result).toEqual({ id: 'inv1', vacunatorioCalidad: true });
    });

    it('lanza error si el registro no existe', async () => {
      mockInvestigacionRepo.findOne.mockResolvedValue(null);
      await expect(service.update('NOEXISTE', {} as any)).rejects.toThrow(
        'El registro de Investigacion con NOEXISTE no existe.',
      );
    });
  });

  describe('delete', () => {
    it('deshabilita el registro y retorna el actualizado', async () => {
      mockInvestigacionRepo.update.mockResolvedValue(undefined);
      mockInvestigacionRepo.findOne.mockResolvedValue({ id: 'inv1', isActive: false });

      const result = await service.delete('inv1', { deletedBy: 'tester' } as any);

      expect(mockInvestigacionRepo.update).toHaveBeenCalledWith(
        'inv1',
        expect.objectContaining({ isActive: false, isEnabled: false, deletedBy: 'tester' }),
      );
      expect(result).toEqual({ id: 'inv1', isActive: false });
    });
  });
});
