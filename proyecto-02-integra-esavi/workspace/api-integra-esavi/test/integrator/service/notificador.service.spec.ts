import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificadorService } from 'src/integrator/service/notificador.service';
import { Notificador } from 'src/integrator/entity/notificador.entity';
import { CatalogoPadre } from 'src/integrator/entity/catalogo-padre.entity';

const mockNotificadorRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
};

const mockCatalogoPadreRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
};

describe('NotificadorService', () => {
  let service: NotificadorService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockNotificadorRepo.create.mockImplementation((data) => ({ ...data }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificadorService,
        { provide: getRepositoryToken(Notificador, 'POSTGRES_INTEGRATOR_DS'), useValue: mockNotificadorRepo },
        { provide: getRepositoryToken(CatalogoPadre, 'POSTGRES_INTEGRATOR_DS'), useValue: mockCatalogoPadreRepo },
      ],
    }).compile();

    service = module.get<NotificadorService>(NotificadorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createOrUpdateFromVigiflow ───────────────────────────────────────────

  describe('createOrUpdateFromVigiflow', () => {
    it('retorna null si la identificación es vacía o nula', async () => {
      expect(await service.createOrUpdateFromVigiflow('', 'Doctor')).toBeNull();
      expect(await service.createOrUpdateFromVigiflow(null as any, 'Doctor')).toBeNull();
      expect(mockNotificadorRepo.findOne).not.toHaveBeenCalled();
    });

    it('crea un nuevo notificador cuando no existe, sin profesión', async () => {
      mockNotificadorRepo.findOne.mockResolvedValue(null);
      mockNotificadorRepo.save.mockImplementation((n) => Promise.resolve(n));

      const result = await service.createOrUpdateFromVigiflow(' 12345 ', null, 'Juan Perez');

      expect(mockNotificadorRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ identificacion: '12345', isActive: true, isEnabled: true }),
      );
      expect(result.nombres).toBe('Juan Perez');
    });

    it('asigna profesión cuando encuentra coincidencia >= 90% de similitud', async () => {
      mockNotificadorRepo.findOne.mockResolvedValue(null);
      mockCatalogoPadreRepo.find.mockResolvedValue([
        { id: 'cp1', nombre: 'MEDICO GENERAL' },
        { id: 'cp2', nombre: 'ENFERMERO' },
      ]);
      mockNotificadorRepo.save.mockImplementation((n) => Promise.resolve(n));

      const result = await service.createOrUpdateFromVigiflow('12345', 'MEDICO GENERAL');

      expect(mockCatalogoPadreRepo.find).toHaveBeenCalledWith({
        where: { padre: { codigo: 'OCUPACION' }, isEnabled: true },
        relations: ['padre'],
      });
      expect(result.profesion).toEqual({ id: 'cp1', nombre: 'MEDICO GENERAL' });
    });

    it('no asigna profesión cuando la mejor similitud es < 90%', async () => {
      mockNotificadorRepo.findOne.mockResolvedValue(null);
      mockCatalogoPadreRepo.find.mockResolvedValue([{ id: 'cp1', nombre: 'ABOGADO' }]);
      mockNotificadorRepo.save.mockImplementation((n) => Promise.resolve(n));

      const result = await service.createOrUpdateFromVigiflow('12345', 'MEDICO GENERAL XYZ COMPLETAMENTE DISTINTO');

      expect(result.profesion).toBeUndefined();
    });

    it('continúa sin lanzar si la búsqueda de profesión falla', async () => {
      mockNotificadorRepo.findOne.mockResolvedValue(null);
      mockCatalogoPadreRepo.find.mockRejectedValue(new Error('DB down'));
      mockNotificadorRepo.save.mockImplementation((n) => Promise.resolve(n));

      await expect(service.createOrUpdateFromVigiflow('12345', 'MEDICO')).resolves.toBeDefined();
    });

    it('reutiliza notificador existente y actualiza nombres', async () => {
      const existing: any = { identificacion: '12345', nombres: 'Old Name' };
      mockNotificadorRepo.findOne.mockResolvedValue(existing);
      mockNotificadorRepo.save.mockImplementation((n) => Promise.resolve(n));

      const result = await service.createOrUpdateFromVigiflow('12345', null, 'New Name');

      expect(mockNotificadorRepo.create).not.toHaveBeenCalled();
      expect(result.nombres).toBe('New Name');
    });
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('lanza error si ya existe un notificador con la misma identificación', async () => {
      mockNotificadorRepo.findOne.mockResolvedValue({ identificacion: '12345' });

      await expect(service.create({ identificacion: '12345' } as any)).rejects.toThrow(
        'Ya existe un notificador con identificación: 12345',
      );
    });

    it('crea un notificador nuevo sin profesión', async () => {
      mockNotificadorRepo.findOne.mockResolvedValue(null);
      mockNotificadorRepo.save.mockResolvedValue({ identificacion: '999' });

      const result = await service.create({ identificacion: '999', nombres: 'Nuevo' } as any);

      expect(mockNotificadorRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ identificacion: '999' });
    });

    it('asigna la profesión indicada por profesionId', async () => {
      mockNotificadorRepo.findOne.mockResolvedValue(null);
      mockCatalogoPadreRepo.findOne.mockResolvedValue({ id: 'prof-1' });
      mockNotificadorRepo.save.mockImplementation((n) => Promise.resolve(n));

      const result = await service.create({ identificacion: '999', profesionId: 'prof-1' } as any);

      expect(result.profesion).toEqual({ id: 'prof-1' });
    });

    it('lanza NotFoundException si profesionId no existe', async () => {
      mockNotificadorRepo.findOne.mockResolvedValue(null);
      mockCatalogoPadreRepo.findOne.mockResolvedValue(null);

      await expect(service.create({ identificacion: '999', profesionId: 'no-existe' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── findAll / findOne ──────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retorna notificadores activos ordenados por nombre', async () => {
      mockNotificadorRepo.find.mockResolvedValue([{ identificacion: '1' }]);
      const result = await service.findAll();
      expect(mockNotificadorRepo.find).toHaveBeenCalledWith({
        where: { isEnabled: true },
        relations: ['profesion'],
        order: { nombres: 'ASC' },
      });
      expect(result).toEqual([{ identificacion: '1' }]);
    });
  });

  describe('findOne', () => {
    it('retorna el notificador cuando existe', async () => {
      mockNotificadorRepo.findOne.mockResolvedValue({ identificacion: '1' });
      const result = await service.findOne('1');
      expect(result).toEqual({ identificacion: '1' });
    });

    it('lanza NotFoundException cuando no existe', async () => {
      mockNotificadorRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('no-existe')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('actualiza nombres y limpia profesión cuando profesionId es null', async () => {
      const existing: any = { identificacion: '1', nombres: 'Old', profesion: { id: 'prof-1' } };
      mockNotificadorRepo.findOne.mockResolvedValue(existing);
      mockNotificadorRepo.merge.mockImplementation((entity, data) => Object.assign(entity, data));
      mockNotificadorRepo.save.mockImplementation((n) => Promise.resolve(n));

      const result = await service.update('1', { nombres: 'Nuevo', profesionId: null } as any);

      expect(result.profesion).toBeNull();
      expect(result.nombres).toBe('Nuevo');
    });

    it('asigna nueva profesión cuando profesionId apunta a una válida', async () => {
      const existing: any = { identificacion: '1', nombres: 'Old' };
      mockNotificadorRepo.findOne.mockResolvedValue(existing);
      mockNotificadorRepo.merge.mockImplementation((entity, data) => Object.assign(entity, data));
      mockCatalogoPadreRepo.findOne.mockResolvedValue({ id: 'prof-2' });
      mockNotificadorRepo.save.mockImplementation((n) => Promise.resolve(n));

      const result = await service.update('1', { profesionId: 'prof-2' } as any);

      expect(result.profesion).toEqual({ id: 'prof-2' });
    });

    it('lanza NotFoundException si la nueva profesionId no existe', async () => {
      const existing: any = { identificacion: '1', nombres: 'Old' };
      mockNotificadorRepo.findOne.mockResolvedValue(existing);
      mockNotificadorRepo.merge.mockImplementation((entity, data) => Object.assign(entity, data));
      mockCatalogoPadreRepo.findOne.mockResolvedValue(null);

      await expect(service.update('1', { profesionId: 'no-existe' } as any)).rejects.toThrow(NotFoundException);
    });

    it('no toca profesion cuando profesionId es undefined en el dto', async () => {
      const existing: any = { identificacion: '1', nombres: 'Old', profesion: { id: 'prof-1' } };
      mockNotificadorRepo.findOne.mockResolvedValue(existing);
      mockNotificadorRepo.merge.mockImplementation((entity, data) => Object.assign(entity, data));
      mockNotificadorRepo.save.mockImplementation((n) => Promise.resolve(n));

      const result = await service.update('1', { nombres: 'Otro' } as any);

      expect(result.profesion).toEqual({ id: 'prof-1' });
    });
  });

  // ─── buscarProfesionPorNombre ───────────────────────────────────────────────

  describe('buscarProfesionPorNombre', () => {
    it('retorna null si descripcion está vacía', async () => {
      expect(await service.buscarProfesionPorNombre('')).toBeNull();
      expect(mockCatalogoPadreRepo.find).not.toHaveBeenCalled();
    });

    it('retorna la mejor coincidencia si supera el 90% de similitud', async () => {
      mockCatalogoPadreRepo.find.mockResolvedValue([{ id: 'cp1', nombre: 'MEDICO GENERAL' }]);
      const result = await service.buscarProfesionPorNombre('MEDICO GENERAL');
      expect(result).toEqual({ id: 'cp1', nombre: 'MEDICO GENERAL' });
    });

    it('retorna null si ninguna coincidencia supera el 90%', async () => {
      mockCatalogoPadreRepo.find.mockResolvedValue([{ id: 'cp1', nombre: 'COMPLETAMENTE DIFERENTE' }]);
      const result = await service.buscarProfesionPorNombre('MEDICO');
      expect(result).toBeNull();
    });
  });

  // ─── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('marca isEnabled en false y guarda auditoría de borrado', async () => {
      const existing: any = { identificacion: '1', isEnabled: true };
      mockNotificadorRepo.findOne.mockResolvedValue(existing);
      mockNotificadorRepo.save.mockImplementation((n) => Promise.resolve(n));

      const result = await service.delete('1', 'admin');

      expect(result.isEnabled).toBe(false);
      expect(result.deletedBy).toBe('admin');
    });

    it('lanza NotFoundException si el notificador a borrar no existe', async () => {
      mockNotificadorRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('no-existe')).rejects.toThrow(NotFoundException);
    });
  });
});
