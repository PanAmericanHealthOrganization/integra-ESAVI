import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CantonService } from './canton.service';
import { Canton } from '../entity/canton.entity';
import { Provincia } from '../entity/provincia.entity';

const mockCantonRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  merge: jest.fn(),
};

const mockProvinciaRepo = {
  findOne: jest.fn(),
};

describe('CantonService', () => {
  let service: CantonService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CantonService,
        { provide: getRepositoryToken(Canton, 'POSTGRES_INTEGRATOR_DS'), useValue: mockCantonRepo },
        { provide: getRepositoryToken(Provincia, 'POSTGRES_INTEGRATOR_DS'), useValue: mockProvinciaRepo },
      ],
    }).compile();
    service = module.get<CantonService>(CantonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('crea un cantón nuevo', async () => {
      mockCantonRepo.findOne.mockResolvedValue(null);
      mockProvinciaRepo.findOne.mockResolvedValue({ codigo: '01' });
      mockCantonRepo.create.mockImplementation((data) => data);
      mockCantonRepo.save.mockResolvedValue({ codigo: '0101', nombre: 'Cuenca' });

      const result = await service.create(
        { codigo: '0101', nombre: 'CUENCA', provinciaCodigo: '01' } as any,
        'tester',
      );

      expect(mockCantonRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Cuenca', createdBy: 'tester' }),
      );
      expect(result).toEqual({ codigo: '0101', nombre: 'Cuenca' });
    });

    it('lanza BadRequestException si el código ya existe', async () => {
      mockCantonRepo.findOne.mockResolvedValue({ codigo: '0101' });

      await expect(
        service.create({ codigo: '0101', nombre: 'X', provinciaCodigo: '01' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si la provincia no existe', async () => {
      mockCantonRepo.findOne.mockResolvedValue(null);
      mockProvinciaRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ codigo: '0101', nombre: 'X', provinciaCodigo: 'NOEXISTE' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('busca cantones habilitados con relación a provincia', async () => {
      mockCantonRepo.find.mockResolvedValue([{ codigo: '0101' }]);
      const result = await service.findAll();
      expect(mockCantonRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isEnabled: true }, relations: ['provincia'] }),
      );
      expect(result).toEqual([{ codigo: '0101' }]);
    });
  });

  describe('findByProvincia', () => {
    it('busca cantones filtrando por provincia', async () => {
      mockCantonRepo.find.mockResolvedValue([{ codigo: '0101' }]);
      const result = await service.findByProvincia('01');
      expect(mockCantonRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { provincia: { codigo: '01' }, isEnabled: true } }),
      );
      expect(result).toEqual([{ codigo: '0101' }]);
    });
  });

  describe('findOne', () => {
    it('retorna el cantón si existe', async () => {
      mockCantonRepo.findOne.mockResolvedValue({ codigo: '0101' });
      const result = await service.findOne('0101');
      expect(result).toEqual({ codigo: '0101' });
    });

    it('lanza NotFoundException si no existe', async () => {
      mockCantonRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('NOEXISTE')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('actualiza el nombre y guarda', async () => {
      mockCantonRepo.findOne.mockResolvedValue({ codigo: '0101', nombre: 'Viejo', isEnabled: true });
      mockCantonRepo.merge.mockImplementation((c, data) => Object.assign(c, data));
      mockCantonRepo.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.update('0101', { nombre: 'NUEVO NOMBRE' } as any, 'tester');

      expect(result.nombre).toBe('Nuevo nombre');
      expect(result.updatedBy).toBe('tester');
    });

    it('actualiza la provincia si se especifica provinciaCodigo válido', async () => {
      mockCantonRepo.findOne.mockResolvedValue({ codigo: '0101', isEnabled: true });
      mockProvinciaRepo.findOne.mockResolvedValue({ codigo: '02' });
      mockCantonRepo.merge.mockImplementation((c, data) => Object.assign(c, data));
      mockCantonRepo.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.update('0101', { provinciaCodigo: '02' } as any);

      expect(result.provincia).toEqual({ codigo: '02' });
    });

    it('lanza NotFoundException si la nueva provincia no existe', async () => {
      mockCantonRepo.findOne.mockResolvedValue({ codigo: '0101', isEnabled: true });
      mockProvinciaRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('0101', { provinciaCodigo: 'NOEXISTE' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deshabilita el cantón', async () => {
      mockCantonRepo.findOne.mockResolvedValue({ codigo: '0101', isEnabled: true });
      mockCantonRepo.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.delete('0101', 'tester');

      expect(result.isEnabled).toBe(false);
      expect(result.deletedBy).toBe('tester');
    });
  });
});
