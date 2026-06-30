import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CatalogoPadreService } from './catalogo-padre.service';
import { CatalogoPadre } from '../entity/catalogo-padre.entity';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

const makeSubcat = (id: string, nombre: string, codigoPadre: string): Partial<CatalogoPadre> => ({
  id,
  nombre,
  padre: { codigo: codigoPadre } as CatalogoPadre,
  isEnabled: true,
} as CatalogoPadre);

describe('CatalogoPadreService', () => {
  let service: CatalogoPadreService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogoPadreService,
        { provide: getRepositoryToken(CatalogoPadre, 'POSTGRES_INTEGRATOR_DS'), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<CatalogoPadreService>(CatalogoPadreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── preloadSubcategoriasMap ─────────────────────────────────────────────

  describe('preloadSubcategoriasMap', () => {
    it('agrupa subcategorías por código del padre', async () => {
      mockRepo.find.mockResolvedValue([
        makeSubcat('1', 'Inicial', 'TIPO_REPORTE'),
        makeSubcat('2', 'Seguimiento', 'TIPO_REPORTE'),
        makeSubcat('3', 'Profesional de la salud', 'TIPO_EMISOR'),
      ]);

      await service.preloadSubcategoriasMap();

      expect(mockRepo.find).toHaveBeenCalledTimes(1);
    });

    it('ignora elementos cuyo padre no tiene código', async () => {
      mockRepo.find.mockResolvedValue([
        { id: '1', nombre: 'Huérfano', padre: null, isEnabled: true },
      ]);
      await expect(service.preloadSubcategoriasMap()).resolves.not.toThrow();
    });

    it('después del preload, buscarSubcategoriaPorSimilitud no llama a la BD', async () => {
      mockRepo.find.mockResolvedValue([makeSubcat('1', 'Inicial', 'TIPO_REPORTE')]);
      await service.preloadSubcategoriasMap();

      await service.buscarSubcategoriaPorSimilitud('TIPO_REPORTE', 'Inicial');

      expect(mockRepo.find).toHaveBeenCalledTimes(1); // solo el preload
    });
  });

  // ─── buscarSubcategoriaPorSimilitud CON caché ────────────────────────────

  describe('buscarSubcategoriaPorSimilitud - con caché', () => {
    beforeEach(async () => {
      mockRepo.find.mockResolvedValue([
        makeSubcat('1', 'Inicial', 'TIPO_REPORTE'),
        makeSubcat('2', 'Seguimiento', 'TIPO_REPORTE'),
        makeSubcat('3', 'Cierre', 'TIPO_REPORTE'),
        makeSubcat('4', 'Profesional de la salud', 'TIPO_EMISOR'),
        makeSubcat('5', 'Paciente / consumidor', 'TIPO_EMISOR'),
      ]);
      await service.preloadSubcategoriasMap();
    });

    it('retorna null para nombre vacío', async () => {
      const result = await service.buscarSubcategoriaPorSimilitud('TIPO_REPORTE', '');
      expect(result).toBeNull();
    });

    it('retorna null para nombre solo espacios', async () => {
      const result = await service.buscarSubcategoriaPorSimilitud('TIPO_REPORTE', '   ');
      expect(result).toBeNull();
    });

    it('encuentra coincidencia exacta', async () => {
      const result = await service.buscarSubcategoriaPorSimilitud('TIPO_REPORTE', 'Inicial');
      expect(result).toBeDefined();
      expect(result.nombre).toBe('Inicial');
    });

    it('encuentra coincidencia con diferente capitalización', async () => {
      const result = await service.buscarSubcategoriaPorSimilitud('TIPO_REPORTE', 'INICIAL');
      expect(result).toBeDefined();
      expect(result.nombre).toBe('Inicial');
    });

    it('retorna null cuando similitud < 90%', async () => {
      const result = await service.buscarSubcategoriaPorSimilitud('TIPO_REPORTE', 'XYZ123NOEXISTE');
      expect(result).toBeNull();
    });

    it('retorna null para código de padre desconocido', async () => {
      const result = await service.buscarSubcategoriaPorSimilitud('PADRE_INEXISTENTE', 'Inicial');
      expect(result).toBeNull();
    });

    it('busca en el grupo correcto de padre', async () => {
      const result = await service.buscarSubcategoriaPorSimilitud('TIPO_EMISOR', 'Profesional de la salud');
      expect(result.nombre).toBe('Profesional de la salud');
    });
  });

  // ─── buscarSubcategoriaPorSimilitud SIN caché ────────────────────────────

  describe('buscarSubcategoriaPorSimilitud - sin caché (consulta BD)', () => {
    it('consulta la BD cuando no hay caché', async () => {
      const subcats = [makeSubcat('1', 'Inicial', 'TIPO_REPORTE')];
      mockRepo.find.mockResolvedValue(subcats);

      await service.buscarSubcategoriaPorSimilitud('TIPO_REPORTE', 'Inicial');

      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ padre: { codigo: 'TIPO_REPORTE' } }),
        }),
      );
    });

    it('retorna null si la BD no devuelve subcategorías', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.buscarSubcategoriaPorSimilitud('TIPO_REPORTE', 'Inicial');
      expect(result).toBeNull();
    });
  });

  // ─── clearSubcategoriasCache ─────────────────────────────────────────────

  describe('clearSubcategoriasCache', () => {
    it('limpia el caché y la siguiente llamada vuelve a consultar la BD', async () => {
      mockRepo.find.mockResolvedValue([makeSubcat('1', 'Inicial', 'TIPO_REPORTE')]);
      await service.preloadSubcategoriasMap();

      service.clearSubcategoriasCache();

      mockRepo.find.mockResolvedValue([makeSubcat('1', 'Inicial', 'TIPO_REPORTE')]);
      await service.buscarSubcategoriaPorSimilitud('TIPO_REPORTE', 'Inicial');

      expect(mockRepo.find).toHaveBeenCalledTimes(2);
    });

    it('no lanza excepción si se llama sin haber precargado', () => {
      expect(() => service.clearSubcategoriasCache()).not.toThrow();
    });
  });
});
