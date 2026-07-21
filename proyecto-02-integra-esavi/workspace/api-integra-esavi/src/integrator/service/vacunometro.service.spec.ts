import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VacunometroService } from './vacunometro.service';
import { Vacunometro } from '../entity/vacunometro.entity';

const mockQueryBuilder = {
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  clone: jest.fn(),
  getMany: jest.fn(),
  getCount: jest.fn(),
};

const mockVacunometroRepo = {
  exist: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  insert: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('VacunometroService', () => {
  let service: VacunometroService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockQueryBuilder.clone.mockReturnValue(mockQueryBuilder);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VacunometroService,
        { provide: getRepositoryToken(Vacunometro, 'POSTGRES_INTEGRATOR_DS'), useValue: mockVacunometroRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    service = module.get<VacunometroService>(VacunometroService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exist', () => {
    it('delega en el repositorio', async () => {
      mockVacunometroRepo.exist.mockResolvedValue(true);
      const result = await service.exist('v1');
      expect(result).toBe(true);
      expect(mockVacunometroRepo.exist).toHaveBeenCalledWith({ where: { id: 'v1' } });
    });
  });

  describe('getOne', () => {
    it('retorna el registro encontrado', async () => {
      mockVacunometroRepo.findOne.mockResolvedValue({ id: 'v1' });
      const result = await service.getOne('v1');
      expect(result).toEqual({ id: 'v1' });
    });
  });

  describe('getMany', () => {
    it('busca por lista de ids', async () => {
      mockVacunometroRepo.find.mockResolvedValue([{ id: 'v1' }, { id: 'v2' }]);
      const result = await service.getMany({ ids: ['v1', 'v2'] } as any);
      expect(result.length).toBe(2);
    });
  });

  describe('getPaginated', () => {
    const basePagination = { page: 1, perPage: 10 };

    it('usa createdAt por defecto si el campo de orden no es válido', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await service.getPaginated({
        pagination: basePagination,
        sort: { field: 'campoInvalido', order: 'ASC' } as any,
        filter: {},
      } as any);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('v.createdAt', 'ASC');
    });

    it('aplica filtro unicodigo y nombreVacuna', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([{ id: 'v1' }]);
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const result = await service.getPaginated({
        pagination: basePagination,
        sort: { field: 'total', order: 'DESC' },
        filter: { unicodigo: '123', nombreVacuna: 'BCG' },
      } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('v.unicodigo ILIKE :unicodigo', {
        unicodigo: '%123%',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('v.nombreVacuna ILIKE :nombreVacuna', {
        nombreVacuna: '%BCG%',
      });
      expect(result).toEqual({ data: [{ id: 'v1' }], total: 1 });
    });

    it('aplica filtro de fecha con solo año', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await service.getPaginated({
        pagination: basePagination,
        sort: { field: 'createdAt', order: 'ASC' },
        filter: { fechaAplicacion: '2021' },
      } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'EXTRACT(YEAR FROM v.fechaAplicacion) = :year',
        { year: 2021 },
      );
    });

    it('aplica filtro de fecha con año y mes', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await service.getPaginated({
        pagination: basePagination,
        sort: { field: 'createdAt', order: 'ASC' },
        filter: { fechaAplicacion: '2021-05' },
      } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'EXTRACT(MONTH FROM v.fechaAplicacion) = :month',
        { month: 5 },
      );
    });

    it('aplica filtro de fecha completa como rango', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await service.getPaginated({
        pagination: basePagination,
        sort: { field: 'createdAt', order: 'ASC' },
        filter: { fechaAplicacion: '2021-05-10' },
      } as any);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'v.fechaAplicacion >= :fechaInicio AND v.fechaAplicacion < :fechaFin',
        expect.objectContaining({ fechaInicio: expect.any(String), fechaFin: expect.any(String) }),
      );
    });

    it('ignora el filtro de fecha si no matchea ningún formato', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await service.getPaginated({
        pagination: basePagination,
        sort: { field: 'createdAt', order: 'ASC' },
        filter: { fechaAplicacion: 'no-es-fecha' },
      } as any);

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('retorna todos los registros', async () => {
      mockVacunometroRepo.find.mockResolvedValue([{ id: 'v1' }]);
      const result = await service.findAll();
      expect(result).toEqual([{ id: 'v1' }]);
    });
  });

  describe('create', () => {
    it('guarda el registro con auditoría de creación', async () => {
      mockVacunometroRepo.save.mockResolvedValue({ id: 'v1' });
      const result = await service.create({ unicodigo: '123' } as any);
      expect(mockVacunometroRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ unicodigo: '123', isActive: true, isEnabled: true }),
      );
      expect(result).toEqual({ id: 'v1' });
    });
  });

  describe('update', () => {
    it('actualiza el registro si existe', async () => {
      mockVacunometroRepo.findOne
        .mockResolvedValueOnce({ id: 'v1' })
        .mockResolvedValueOnce({ id: 'v1', unicodigo: 'nuevo' });
      mockVacunometroRepo.update.mockResolvedValue(undefined);

      const result = await service.update('v1', { unicodigo: 'nuevo' } as any);

      expect(mockVacunometroRepo.update).toHaveBeenCalledWith('v1', { unicodigo: 'nuevo' });
      expect(result).toEqual({ id: 'v1', unicodigo: 'nuevo' });
    });

    it('lanza error si el registro no existe', async () => {
      mockVacunometroRepo.findOne.mockResolvedValue(null);
      await expect(service.update('NOEXISTE', {} as any)).rejects.toThrow(
        'El registro con id NOEXISTE no existe.',
      );
    });
  });

  describe('delete', () => {
    it('deshabilita el registro y retorna el actualizado', async () => {
      mockVacunometroRepo.update.mockResolvedValue(undefined);
      mockVacunometroRepo.findOne.mockResolvedValue({ id: 'v1', isActive: false });

      const result = await service.delete('v1', { deletedBy: 'tester' } as any);

      expect(mockVacunometroRepo.update).toHaveBeenCalledWith(
        'v1',
        expect.objectContaining({ isActive: false, isEnabled: false, deletedBy: 'tester' }),
      );
      expect(result).toEqual({ id: 'v1', isActive: false });
    });
  });

  describe('createMany', () => {
    const rawRows = [
      {
        UNICODIGO: '123',
        NOMBRE_VACUNA: 'BCG',
        GRUPO_ETARIO: 1,
        FECHA_APLICACION: '2021-05-10',
        TOTAL_HOMBRES: 5,
        TOTAL_MUJERES: 5,
        TOTAL_REGISTROS: 10,
      },
      {
        UNICODIGO: '456',
        NOMBRE_VACUNA: 'HEP',
        GRUPO_ETARIO: 2,
        FECHA_APLICACION: '2021-06-15',
        TOTAL_HOMBRES: 3,
        TOTAL_MUJERES: 7,
        TOTAL_REGISTROS: 10,
      },
    ];

    it('elimina registros existentes en el rango de fechas y crea los nuevos', async () => {
      mockVacunometroRepo.delete.mockResolvedValue({ affected: 2 });
      mockVacunometroRepo.insert.mockResolvedValue({ identifiers: [] });

      const result = await service.createMany(rawRows);

      expect(mockVacunometroRepo.delete).toHaveBeenCalledTimes(1);
      expect(mockVacunometroRepo.insert).toHaveBeenCalledTimes(1);
      expect(result.length).toBe(1);
    });

    it('propaga un error genérico si algo falla durante el proceso', async () => {
      mockVacunometroRepo.delete.mockRejectedValue(new Error('fallo de borrado'));

      await expect(service.createMany(rawRows)).rejects.toThrow(
        'Hubo un problema al crear o actualizar los datos de vacuna',
      );
    });
  });
});
