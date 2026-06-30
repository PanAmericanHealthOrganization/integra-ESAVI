import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CatalogoService } from './catalogo.service';
import { Catalogo } from '../entity/catalogo.entity';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
};

const makeCatalog = (id: string, vigiflow: string | null): Partial<Catalogo> => ({
  id,
  vigiflow,
} as Catalogo);

describe('CatalogoService', () => {
  let service: CatalogoService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogoService,
        { provide: getRepositoryToken(Catalogo, 'POSTGRES_INTEGRATOR_DS'), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<CatalogoService>(CatalogoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── preloadVigiflowMap ───────────────────────────────────────────────────

  describe('preloadVigiflowMap', () => {
    it('carga todos los catálogos y construye el mapa', async () => {
      mockRepo.find.mockResolvedValue([
        makeCatalog('1', 'AÑOS'),
        makeCatalog('2', 'MESES'),
        makeCatalog('3', null),
      ]);

      await service.preloadVigiflowMap();

      expect(mockRepo.find).toHaveBeenCalledTimes(1);
    });

    it('después del preload, findByDescriptionToVigiflow usa el caché (sin llamar a findOne)', async () => {
      const cat = makeCatalog('1', 'AÑOS');
      mockRepo.find.mockResolvedValue([cat]);

      await service.preloadVigiflowMap();
      const result = await service.findByDescriptionToVigiflow('AÑOS');

      expect(result).toEqual(cat);
      expect(mockRepo.findOne).not.toHaveBeenCalled();
    });

    it('ignora entradas sin campo vigiflow', async () => {
      mockRepo.find.mockResolvedValue([makeCatalog('1', null), makeCatalog('2', undefined as any)]);
      await service.preloadVigiflowMap();

      await expect(service.findByDescriptionToVigiflow('CUALQUIERA')).rejects.toThrow();
    });
  });

  // ─── findByDescriptionToVigiflow ─────────────────────────────────────────

  describe('findByDescriptionToVigiflow', () => {
    it('consulta la BD cuando no hay caché', async () => {
      const cat = makeCatalog('1', 'AÑOS');
      mockRepo.findOne.mockResolvedValue(cat);

      const result = await service.findByDescriptionToVigiflow('AÑOS');

      expect(result).toEqual(cat);
      expect(mockRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('lanza excepción cuando la BD devuelve null', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findByDescriptionToVigiflow('NOEXISTE')).rejects.toThrow();
    });

    it('búsqueda del caché es case-insensitive', async () => {
      const cat = makeCatalog('1', 'AÑOS');
      mockRepo.find.mockResolvedValue([cat]);
      await service.preloadVigiflowMap();

      const result = await service.findByDescriptionToVigiflow('años');

      expect(result).toEqual(cat);
      expect(mockRepo.findOne).not.toHaveBeenCalled();
    });

    it('búsqueda del caché ignora espacios al inicio/fin', async () => {
      const cat = makeCatalog('1', 'MESES');
      mockRepo.find.mockResolvedValue([cat]);
      await service.preloadVigiflowMap();

      const result = await service.findByDescriptionToVigiflow('  MESES  ');

      expect(result).toEqual(cat);
    });

    it('lanza excepción cuando no está en el caché', async () => {
      mockRepo.find.mockResolvedValue([makeCatalog('1', 'AÑOS')]);
      await service.preloadVigiflowMap();

      await expect(service.findByDescriptionToVigiflow('DIA')).rejects.toThrow();
      expect(mockRepo.findOne).not.toHaveBeenCalled();
    });
  });

  // ─── clearVigiflowCache ───────────────────────────────────────────────────

  describe('clearVigiflowCache', () => {
    it('limpia el caché y la siguiente llamada vuelve a consultar la BD', async () => {
      mockRepo.find.mockResolvedValue([makeCatalog('1', 'AÑOS')]);
      await service.preloadVigiflowMap();

      service.clearVigiflowCache();

      const cat = makeCatalog('2', 'MESES');
      mockRepo.findOne.mockResolvedValue(cat);
      const result = await service.findByDescriptionToVigiflow('MESES');

      expect(result).toEqual(cat);
      expect(mockRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('no lanza excepción si se llama sin haber precargado', () => {
      expect(() => service.clearVigiflowCache()).not.toThrow();
    });
  });
});
