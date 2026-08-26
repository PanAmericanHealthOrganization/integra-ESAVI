import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EstablecimientosService } from 'src/integrator/service/establecimientos.service';
import { Establecimiento } from 'src/integrator/entity/establecimiento.entity';
import { Parroquia } from 'src/integrator/entity/parroquia.entity';
import { CatalogoPadre } from 'src/integrator/entity/catalogo-padre.entity';

const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
};

const mockEstablecimientoRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  merge: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

const mockParroquiaRepo = {
  findOne: jest.fn(),
};

const mockCatalogoPadreRepo = {
  findOne: jest.fn(),
};

describe('EstablecimientosService', () => {
  let service: EstablecimientosService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstablecimientosService,
        { provide: getRepositoryToken(Establecimiento, 'POSTGRES_INTEGRATOR_DS'), useValue: mockEstablecimientoRepo },
        { provide: getRepositoryToken(Parroquia, 'POSTGRES_INTEGRATOR_DS'), useValue: mockParroquiaRepo },
        { provide: getRepositoryToken(CatalogoPadre, 'POSTGRES_INTEGRATOR_DS'), useValue: mockCatalogoPadreRepo },
      ],
    }).compile();
    service = module.get<EstablecimientosService>(EstablecimientosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('crea un establecimiento nuevo sin parroquia ni tipoEntidad', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue(null);
      mockEstablecimientoRepo.create.mockImplementation((data) => data);
      const saved = { id: 'e1', uniCodigo: '000123' };
      mockEstablecimientoRepo.save.mockResolvedValue(saved);

      const result = await service.create({ uniCodigo: '123', uniNombre: 'HOSPITAL CENTRAL' } as any);

      expect(mockEstablecimientoRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ uniCodigo: '000123', uniNombre: 'Hospital central' }),
      );
      expect(result).toEqual(saved);
    });

    it('lanza BadRequestException si ya existe un establecimiento activo con el mismo uniCodigo', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({ uniCodigo: '123', uniNombre: 'X' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('asocia parroquia cuando parroquiaCodigo existe', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue(null);
      mockEstablecimientoRepo.create.mockImplementation((data) => data);
      mockParroquiaRepo.findOne.mockResolvedValue({ codigo: '010150' });
      mockEstablecimientoRepo.save.mockResolvedValue({ id: 'e2' });

      await service.create({ uniCodigo: '456', uniNombre: 'X', parroquiaCodigo: '010150' } as any);

      expect(mockParroquiaRepo.findOne).toHaveBeenCalledWith({ where: { codigo: '010150' } });
      expect(mockEstablecimientoRepo.save).toHaveBeenCalled();
    });

    it('lanza NotFoundException si parroquiaCodigo no existe', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue(null);
      mockEstablecimientoRepo.create.mockImplementation((data) => data);
      mockParroquiaRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ uniCodigo: '456', uniNombre: 'X', parroquiaCodigo: 'NOEXISTE' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('asocia tipoEntidad cuando tipoEntidadId existe', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue(null);
      mockEstablecimientoRepo.create.mockImplementation((data) => data);
      mockCatalogoPadreRepo.findOne.mockResolvedValue({ id: 'cp1' });
      mockEstablecimientoRepo.save.mockResolvedValue({ id: 'e3' });

      await service.create({ uniCodigo: '789', uniNombre: 'X', tipoEntidadId: 'cp1' } as any);

      expect(mockCatalogoPadreRepo.findOne).toHaveBeenCalledWith({ where: { id: 'cp1', isEnabled: true } });
    });

    it('lanza NotFoundException si tipoEntidadId no existe', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue(null);
      mockEstablecimientoRepo.create.mockImplementation((data) => data);
      mockCatalogoPadreRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ uniCodigo: '789', uniNombre: 'X', tipoEntidadId: 'NOEXISTE' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('propaga y loguea el error si save falla', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue(null);
      mockEstablecimientoRepo.create.mockImplementation((data) => data);
      mockEstablecimientoRepo.save.mockRejectedValue(new Error('DB down'));

      await expect(
        service.create({ uniCodigo: '123', uniNombre: 'X' } as any),
      ).rejects.toThrow('DB down');
    });

    it('no rellena uniCodigo con ceros si no es numérico', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue(null);
      mockEstablecimientoRepo.create.mockImplementation((data) => data);
      mockEstablecimientoRepo.save.mockResolvedValue({ id: 'e4' });

      await service.create({ uniCodigo: 'ABC123', uniNombre: 'X' } as any);

      expect(mockEstablecimientoRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ uniCodigo: 'ABC123' }),
      );
    });
  });

  describe('findAll', () => {
    it('busca establecimientos habilitados con relaciones', async () => {
      mockEstablecimientoRepo.find.mockResolvedValue([{ id: 'e1' }]);
      const result = await service.findAll();
      expect(mockEstablecimientoRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isEnabled: true } }),
      );
      expect(result).toEqual([{ id: 'e1' }]);
    });
  });

  describe('findAllPaginated', () => {
    it('pagina sin término de búsqueda', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: 'e1' }], 1]);

      const result = await service.findAllPaginated(1, 10);

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual({ data: [{ id: 'e1' }], total: 1 });
    });

    it('agrega filtro de búsqueda cuando q tiene contenido', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAllPaginated(2, 5, '  Hospital  ');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.any(String),
        { term: '%hospital%' },
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('ignora el término de búsqueda si viene vacío tras trim', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAllPaginated(1, 10, '   ');

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('findAllLight', () => {
    it('retorna sólo id y uniNombre', async () => {
      mockEstablecimientoRepo.find.mockResolvedValue([{ id: 'e1', uniNombre: 'X' }]);
      const result = await service.findAllLight();
      expect(mockEstablecimientoRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ select: ['id', 'uniNombre'] }),
      );
      expect(result).toEqual([{ id: 'e1', uniNombre: 'X' }]);
    });
  });

  describe('findOne', () => {
    it('retorna el establecimiento si existe', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue({ id: 'e1' });
      const result = await service.findOne('e1');
      expect(result).toEqual({ id: 'e1' });
    });

    it('lanza NotFoundException si no existe', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('NOEXISTE')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUniCodigo', () => {
    it('retorna el establecimiento si existe', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue({ id: 'e1', uniCodigo: '000123' });
      const result = await service.findByUniCodigo('000123');
      expect(result).toEqual({ id: 'e1', uniCodigo: '000123' });
    });

    it('lanza NotFoundException si no existe', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue(null);
      await expect(service.findByUniCodigo('000999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('actualiza campos básicos y guarda', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue({ id: 'e1', uniNombre: 'Viejo', isEnabled: true });
      mockEstablecimientoRepo.merge.mockImplementation((est, data) => Object.assign(est, data));
      mockEstablecimientoRepo.save.mockResolvedValue({ id: 'e1', uniNombre: 'Nuevo nombre' });

      const result = await service.update('e1', { uniNombre: 'NUEVO NOMBRE' } as any);

      expect(mockEstablecimientoRepo.merge).toHaveBeenCalled();
      expect(result).toEqual({ id: 'e1', uniNombre: 'Nuevo nombre' });
    });

    it('actualiza parroquia cuando parroquiaCodigo es un valor truthy', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue({ id: 'e1', isEnabled: true });
      mockParroquiaRepo.findOne.mockResolvedValue({ codigo: '010150' });
      mockEstablecimientoRepo.merge.mockImplementation((est, data) => Object.assign(est, data));
      mockEstablecimientoRepo.save.mockResolvedValue({ id: 'e1' });

      await service.update('e1', { parroquiaCodigo: '010150' } as any);

      expect(mockParroquiaRepo.findOne).toHaveBeenCalledWith({ where: { codigo: '010150' } });
    });

    it('lanza NotFoundException si parroquiaCodigo no existe al actualizar', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue({ id: 'e1', isEnabled: true });
      mockParroquiaRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('e1', { parroquiaCodigo: 'NOEXISTE' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('limpia parroquiaResidencia cuando parroquiaCodigo llega como cadena vacía', async () => {
      const est = { id: 'e1', isEnabled: true, parroquiaResidencia: { codigo: 'X' } };
      mockEstablecimientoRepo.findOne.mockResolvedValue(est);
      mockEstablecimientoRepo.merge.mockImplementation((e, data) => Object.assign(e, data));
      mockEstablecimientoRepo.save.mockResolvedValue(est);

      await service.update('e1', { parroquiaCodigo: '' } as any);

      expect(est.parroquiaResidencia).toBeNull();
    });

    it('actualiza tipoEntidad cuando tipoEntidadId es truthy', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue({ id: 'e1', isEnabled: true });
      mockCatalogoPadreRepo.findOne.mockResolvedValue({ id: 'cp1' });
      mockEstablecimientoRepo.merge.mockImplementation((est, data) => Object.assign(est, data));
      mockEstablecimientoRepo.save.mockResolvedValue({ id: 'e1' });

      await service.update('e1', { tipoEntidadId: 'cp1' } as any);

      expect(mockCatalogoPadreRepo.findOne).toHaveBeenCalledWith({ where: { id: 'cp1', isEnabled: true } });
    });

    it('lanza NotFoundException si tipoEntidadId no existe al actualizar', async () => {
      mockEstablecimientoRepo.findOne.mockResolvedValue({ id: 'e1', isEnabled: true });
      mockCatalogoPadreRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('e1', { tipoEntidadId: 'NOEXISTE' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('limpia tipoEntidad cuando tipoEntidadId llega como cadena vacía', async () => {
      const est = { id: 'e1', isEnabled: true, tipoEntidad: { id: 'X' } };
      mockEstablecimientoRepo.findOne.mockResolvedValue(est);
      mockEstablecimientoRepo.merge.mockImplementation((e, data) => Object.assign(e, data));
      mockEstablecimientoRepo.save.mockResolvedValue(est);

      await service.update('e1', { tipoEntidadId: '' } as any);

      expect(est.tipoEntidad).toBeNull();
    });
  });

  describe('delete', () => {
    it('marca isEnabled en false y setea auditoria de borrado', async () => {
      const est = { id: 'e1', isEnabled: true };
      mockEstablecimientoRepo.findOne.mockResolvedValue(est);
      mockEstablecimientoRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.delete('e1', 'tester');

      expect(result.isEnabled).toBe(false);
      expect(result.deletedBy).toBe('tester');
      expect(result.deletedAt).toBeInstanceOf(Date);
    });
  });
});
