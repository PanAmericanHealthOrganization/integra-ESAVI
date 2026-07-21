import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DatoEsaviService } from './dato-esavi.service';
import { DatoEsavi } from '../entity/dato-esavi.entity';

const mockDatoEsaviRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  merge: jest.fn(),
};

describe('DatoEsaviService', () => {
  let service: DatoEsaviService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatoEsaviService,
        { provide: getRepositoryToken(DatoEsavi, 'POSTGRES_INTEGRATOR_DS'), useValue: mockDatoEsaviRepo },
      ],
    }).compile();
    service = module.get<DatoEsaviService>(DatoEsaviService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVigiflow', () => {
    const notificacion = { id: 'n1' } as any;

    it('crea un DatoEsavi nuevo cuando no existe uno igual', async () => {
      mockDatoEsaviRepo.findOne.mockResolvedValue(null);
      mockDatoEsaviRepo.save.mockResolvedValue({ id: 'de1' });

      const result = await service.createVigiflow(notificacion, {
        fechaEsavi: new Date('2021-01-01'),
        nombre: 'Fiebre',
      } as any);

      expect(mockDatoEsaviRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'de1' });
    });

    it('actualiza el DatoEsavi existente si coincide notificacion, fecha y nombre', async () => {
      const existing = { id: 'de1', nombre: 'Fiebre' };
      mockDatoEsaviRepo.findOne.mockResolvedValue(existing);
      mockDatoEsaviRepo.save.mockImplementation((d) => Promise.resolve(d));

      const result = await service.createVigiflow(notificacion, {
        fechaEsavi: new Date('2021-01-01'),
        nombre: 'Fiebre',
        descripcion: 'actualizado',
      } as any);

      expect(result.descripcion).toBe('actualizado');
      expect(result.notificacion).toEqual(notificacion);
    });

    it('propaga un error genérico cuando falla el guardado', async () => {
      mockDatoEsaviRepo.findOne.mockRejectedValue(new Error('DB down'));

      await expect(
        service.createVigiflow(notificacion, { fechaEsavi: new Date(), nombre: 'X' } as any),
      ).rejects.toThrow('Hubo un problema al crear o actualizar datos esavi');
    });
  });

  describe('create', () => {
    const notificacion = { id: 'n1' } as any;

    it('crea un único DatoEsavi cuando el dto no es un arreglo y no existe uno igual', async () => {
      mockDatoEsaviRepo.findOne.mockResolvedValue(null);
      mockDatoEsaviRepo.save.mockResolvedValue(undefined);

      const result = await service.create(notificacion, {
        fechaEsavi: new Date('2021-01-01'),
        nombre: 'Fiebre',
        descripcion: 'desc',
      } as any);

      expect(Array.isArray(result)).toBe(false);
      expect(mockDatoEsaviRepo.save).toHaveBeenCalledTimes(1);
    });

    it('actualiza un DatoEsavi existente cuando coincide notificacion, fecha, nombre y descripcion', async () => {
      const existing = { id: 'de1' };
      mockDatoEsaviRepo.findOne.mockResolvedValue(existing);
      mockDatoEsaviRepo.save.mockResolvedValue(undefined);

      const result = await service.create(notificacion, {
        fechaEsavi: new Date('2021-01-01'),
        nombre: 'Fiebre',
        descripcion: 'desc',
      } as any);

      expect(result).toEqual(expect.objectContaining({ id: 'de1' }));
    });

    it('procesa un arreglo de dtos y retorna un arreglo de resultados', async () => {
      mockDatoEsaviRepo.findOne.mockResolvedValue(null);
      mockDatoEsaviRepo.save.mockResolvedValue(undefined);

      const result = await service.create(notificacion, [
        { fechaEsavi: new Date('2021-01-01'), nombre: 'Fiebre', descripcion: 'a' },
        { fechaEsavi: new Date('2021-02-01'), nombre: 'Dolor', descripcion: 'b' },
      ] as any);

      expect(Array.isArray(result)).toBe(true);
      expect((result as any[]).length).toBe(2);
      expect(mockDatoEsaviRepo.save).toHaveBeenCalledTimes(2);
    });

    it('propaga un error genérico cuando falla el procesamiento', async () => {
      mockDatoEsaviRepo.findOne.mockRejectedValue(new Error('DB down'));

      await expect(
        service.create(notificacion, { fechaEsavi: new Date(), nombre: 'X' } as any),
      ).rejects.toThrow('Hubo un problema al crear o actualizar los datos ESAVI');
    });
  });

  describe('delete', () => {
    it('retorna undefined (no implementado)', async () => {
      const result = await service.delete('de1');
      expect(result).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('busca datos esavi activos', async () => {
      mockDatoEsaviRepo.find.mockResolvedValue([{ id: 'de1' }]);
      const result = await service.findAll();
      expect(mockDatoEsaviRepo.find).toHaveBeenCalledWith({ where: { isActive: true } });
      expect(result).toEqual([{ id: 'de1' }]);
    });
  });

  describe('findOne', () => {
    it('retorna el registro si existe', async () => {
      mockDatoEsaviRepo.findOne.mockResolvedValue({ id: 'de1' });
      const result = await service.findOne('de1');
      expect(result).toEqual({ id: 'de1' });
    });

    it('lanza EntityNotFoundException si no existe', async () => {
      mockDatoEsaviRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('NOEXISTE')).rejects.toThrow();
    });
  });

  describe('findByNotificacionId', () => {
    it('busca ordenado por fechaEsavi ASC', async () => {
      mockDatoEsaviRepo.find.mockResolvedValue([{ id: 'de1' }]);
      const result = await service.findByNotificacionId('n1');
      expect(mockDatoEsaviRepo.find).toHaveBeenCalledWith({
        where: { notificacion: { id: 'n1' } },
        order: { fechaEsavi: 'ASC' },
      });
      expect(result).toEqual([{ id: 'de1' }]);
    });
  });

  describe('update', () => {
    it('actualiza el registro existente', async () => {
      mockDatoEsaviRepo.findOne.mockResolvedValue({ id: 'de1', nombre: 'Viejo' });
      mockDatoEsaviRepo.merge.mockImplementation((e, dto) => Object.assign(e, dto));
      mockDatoEsaviRepo.save.mockImplementation((e) => Promise.resolve(e));

      const result = await service.update('de1', { nombre: 'Nuevo' } as any);

      expect(result.nombre).toBe('Nuevo');
    });
  });
});
