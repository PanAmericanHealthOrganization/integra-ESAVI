import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificacionVigiflowService } from './notificacion-vigiflow.service';
import { Notificacion } from '../entity/notificacion.entity';
import { Parroquia } from '../entity/parroquia.entity';
import { CatalogoPadreService } from './catalogo-padre.service';

const mockNotificacionRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  manager: {
    query: jest.fn(),
  },
};

const mockParroquiaRepo = {
  findOne: jest.fn(),
};

const mockCatalogoPadreService = {
  buscarSubcategoriaPorSimilitud: jest.fn(),
  preloadSubcategoriasMap: jest.fn(),
  clearSubcategoriasCache: jest.fn(),
};

const makeNotif = (overrides: Partial<Notificacion> = {}): Notificacion =>
  ({
    id: 'not-1',
    codigoOrigenNotificacion: 'EC-001',
    edad: 30,
    unidadEdad: null,
    parroquiaResidencia: null,
    isActive: true,
    ...overrides,
  } as Notificacion);

describe('NotificacionVigiflowService', () => {
  let service: NotificacionVigiflowService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificacionVigiflowService,
        { provide: getRepositoryToken(Notificacion, 'POSTGRES_INTEGRATOR_DS'), useValue: mockNotificacionRepo },
        { provide: getRepositoryToken(Parroquia, 'POSTGRES_INTEGRATOR_DS'), useValue: mockParroquiaRepo },
        { provide: CatalogoPadreService, useValue: mockCatalogoPadreService },
      ],
    }).compile();
    service = module.get<NotificacionVigiflowService>(NotificacionVigiflowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findAllByCodigosOrigen ───────────────────────────────────────────────

  describe('findAllByCodigosOrigen', () => {
    it('retorna mapa vacío para arreglo vacío (sin consultar BD)', async () => {
      const result = await service.findAllByCodigosOrigen([]);

      expect(result).toEqual(new Map());
      expect(mockNotificacionRepo.find).not.toHaveBeenCalled();
    });

    it('agrupa notificaciones por codigoOrigenNotificacion', async () => {
      const n1a = makeNotif({ id: 'a', codigoOrigenNotificacion: 'EC-001' });
      const n1b = makeNotif({ id: 'b', codigoOrigenNotificacion: 'EC-001' });
      const n2  = makeNotif({ id: 'c', codigoOrigenNotificacion: 'EC-002' });
      mockNotificacionRepo.find.mockResolvedValue([n1a, n1b, n2]);

      const result = await service.findAllByCodigosOrigen(['EC-001', 'EC-002']);

      expect(mockNotificacionRepo.find).toHaveBeenCalledTimes(1);
      expect(result.get('EC-001')).toHaveLength(2);
      expect(result.get('EC-002')).toHaveLength(1);
    });

    it('ignora notificaciones sin codigoOrigenNotificacion', async () => {
      mockNotificacionRepo.find.mockResolvedValue([
        { id: 'x', codigoOrigenNotificacion: null },
      ]);

      const result = await service.findAllByCodigosOrigen(['EC-001']);

      expect(result.size).toBe(0);
    });
  });

  // ─── create - actualización de notificación existente ────────────────────

  describe('create - notificación existente (update path)', () => {
    it('actualiza edad cuando cambia y guarda', async () => {
      const existing = makeNotif({ edad: 30 });
      mockNotificacionRepo.save.mockResolvedValue({ ...existing, edad: 35 });

      const dto = {
        codigoVigiflow: 'EC-001',
        edad: 35,
        residenciaPaciente: {},
      } as any;

      await service.create(dto, { id: 'p1' } as any, existing);

      expect(mockNotificacionRepo.save).toHaveBeenCalledTimes(1);
    });

    it('NO guarda cuando edad es la misma', async () => {
      const existing = makeNotif({ edad: 30 });

      const dto = {
        codigoVigiflow: 'EC-001',
        edad: 30,
        residenciaPaciente: {},
      } as any;

      await service.create(dto, { id: 'p1' } as any, existing);

      expect(mockNotificacionRepo.save).not.toHaveBeenCalled();
    });

    it('actualiza unidadEdad cuando se proporciona en el DTO', async () => {
      const existing = makeNotif({ edad: 30 });
      const unidadCat = { id: 'cat-anios' };
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud.mockResolvedValue(unidadCat);
      mockNotificacionRepo.save.mockResolvedValue(existing);

      const dto = {
        codigoVigiflow: 'EC-001',
        unidadEdadPaciente: 'AÑOS',
        residenciaPaciente: {},
      } as any;

      await service.create(dto, { id: 'p1' } as any, existing);

      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).toHaveBeenCalledWith('UNIDAD_EDAD', 'AÑOS');
      expect(mockNotificacionRepo.save).toHaveBeenCalledTimes(1);
    });

    it('no falla cuando el catálogo de unidadEdad no se encuentra', async () => {
      const existing = makeNotif({ edad: 30 });
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud.mockResolvedValue(null);

      const dto = {
        codigoVigiflow: 'EC-001',
        unidadEdadPaciente: 'DESCONOCIDO',
        residenciaPaciente: {},
      } as any;

      await expect(service.create(dto, { id: 'p1' } as any, existing)).resolves.not.toThrow();
    });

    it('actualiza parroquiaResidencia cuando se proporciona código válido', async () => {
      const existing = makeNotif();
      const parroquia = { id: 'par1', codigo: '170150' };
      mockParroquiaRepo.findOne.mockResolvedValue(parroquia);
      mockNotificacionRepo.save.mockResolvedValue(existing);

      const dto = {
        codigoVigiflow: 'EC-001',
        residenciaPaciente: { parroquia: 'Quito (170150)' },
      } as any;

      await service.create(dto, { id: 'p1' } as any, existing);

      expect(mockParroquiaRepo.findOne).toHaveBeenCalledTimes(1);
      expect(mockNotificacionRepo.save).toHaveBeenCalledTimes(1);
    });

    it('usa el preloaded directamente sin consultar la BD', async () => {
      const existing = makeNotif({ edad: 30 });

      const dto = {
        codigoVigiflow: 'EC-001',
        edad: 30,
        residenciaPaciente: {},
      } as any;

      await service.create(dto, { id: 'p1' } as any, existing);

      expect(mockNotificacionRepo.findOne).not.toHaveBeenCalled();
    });

    it('retorna la notificación sin guardar cuando nada cambió', async () => {
      const existing = makeNotif({ edad: 25 });

      const dto = {
        codigoVigiflow: 'EC-001',
        edad: 25,
        residenciaPaciente: {},
      } as any;

      const result = await service.create(dto, { id: 'p1' } as any, existing);

      expect(result).toBe(existing);
      expect(mockNotificacionRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── preloadBulk / clearBulkCache ────────────────────────────────────────

  describe('preloadBulk', () => {
    it('llama a preloadSubcategoriasMap y carga establecimientos', async () => {
      mockNotificacionRepo.manager.query.mockResolvedValue([
        { id: 'est1', nombre: 'Hospital Eugenio Espejo' },
      ]);

      await service.preloadBulk();

      expect(mockCatalogoPadreService.preloadSubcategoriasMap).toHaveBeenCalledTimes(1);
      expect(mockNotificacionRepo.manager.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearBulkCache', () => {
    it('limpia el caché de catalogoPadre', () => {
      service.clearBulkCache();

      expect(mockCatalogoPadreService.clearSubcategoriasCache).toHaveBeenCalledTimes(1);
    });
  });

  // ─── matchYGrabarEstablecimiento ──────────────────────────────────────────

  describe('matchYGrabarEstablecimiento', () => {
    const estabs = [
      { id: 'est1', nombre: 'Hospital Eugenio Espejo' },
      { id: 'est2', nombre: 'Centro de Salud Norte' },
    ];

    it('usa el caché de establecimientos sin consultar la BD (no hace SELECT)', async () => {
      mockNotificacionRepo.manager.query.mockResolvedValue(estabs);
      await service.preloadBulk();
      mockNotificacionRepo.manager.query.mockClear(); // resetear contadores post-preload

      await service.matchYGrabarEstablecimiento('not-1', 'Hospital Eugenio Espejo');

      // Solo debe haber llamada de UPDATE, no SELECT
      expect(mockNotificacionRepo.manager.query).not.toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.anything(),
      );
    });

    it('actualiza el establecimiento cuando hay coincidencia exacta', async () => {
      mockNotificacionRepo.manager.query.mockResolvedValue(estabs);
      await service.preloadBulk();
      mockNotificacionRepo.manager.query.mockClear(); // resetear contadores post-preload
      mockNotificacionRepo.manager.query.mockResolvedValue(undefined); // para la UPDATE

      await service.matchYGrabarEstablecimiento('not-1', 'Hospital Eugenio Espejo');

      // Solo la llamada del UPDATE (el SELECT viene del caché)
      expect(mockNotificacionRepo.manager.query).toHaveBeenCalledTimes(1);
      expect(mockNotificacionRepo.manager.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        ['est1', 'not-1'],
      );
    });

    it('no actualiza cuando no hay coincidencia >= 90%', async () => {
      mockNotificacionRepo.manager.query.mockResolvedValue(estabs);
      await service.preloadBulk();
      mockNotificacionRepo.manager.query.mockClear();

      await service.matchYGrabarEstablecimiento('not-1', 'XYZNOEXISTE');

      expect(mockNotificacionRepo.manager.query).not.toHaveBeenCalled();
    });

    it('retorna sin hacer nada cuando orgEmisorExcel está vacío', async () => {
      mockNotificacionRepo.manager.query.mockResolvedValue(estabs);
      await service.preloadBulk();
      mockNotificacionRepo.manager.query.mockClear();

      await service.matchYGrabarEstablecimiento('not-1', '');

      expect(mockNotificacionRepo.manager.query).not.toHaveBeenCalled();
    });

    it('retorna sin hacer nada cuando no hay establecimientos', async () => {
      mockNotificacionRepo.manager.query.mockResolvedValue([]);
      await service.preloadBulk();
      mockNotificacionRepo.manager.query.mockClear();

      await service.matchYGrabarEstablecimiento('not-1', 'Hospital');

      expect(mockNotificacionRepo.manager.query).not.toHaveBeenCalled();
    });

    it('consulta la BD cuando no hay caché de establecimientos', async () => {
      mockNotificacionRepo.manager.query
        .mockResolvedValueOnce(estabs) // SELECT establecimientos
        .mockResolvedValueOnce(undefined); // UPDATE

      await service.matchYGrabarEstablecimiento('not-1', 'Hospital Eugenio Espejo');

      expect(mockNotificacionRepo.manager.query).toHaveBeenCalledTimes(2);
    });

    it('actualiza con coincidencia parcial de palabras >= 90%', async () => {
      mockNotificacionRepo.manager.query.mockResolvedValue([
        { id: 'est3', nombre: 'Centro Medico Metropolitano Sur' },
      ]);
      await service.preloadBulk();
      mockNotificacionRepo.manager.query.mockResolvedValue(undefined);

      await service.matchYGrabarEstablecimiento('not-1', 'Centro Medico Metropolitano Sur');

      expect(mockNotificacionRepo.manager.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.any(Array),
      );
    });
  });

  // ─── findByCodigoOrigen ──────────────────────────────────────────────────

  describe('findByCodigoOrigen', () => {
    it('retorna la notificación cuando existe', async () => {
      const n = makeNotif();
      mockNotificacionRepo.findOne.mockResolvedValue(n);
      const result = await service.findByCodigoOrigen('EC-001');
      expect(result).toEqual(n);
    });

    it('retorna null cuando no existe', async () => {
      mockNotificacionRepo.findOne.mockResolvedValue(null);
      const result = await service.findByCodigoOrigen('NOEXISTE');
      expect(result).toBeNull();
    });
  });

  // ─── analizarCadenaFechaGuionMedio ───────────────────────────────────────

  describe('analizarCadenaFechaGuionMedio', () => {
    it('parsea correctamente una fecha YYYY-MM-DD válida', () => {
      const result = service.analizarCadenaFechaGuionMedio('2024-06-15');
      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCFullYear()).toBe(2024);
      expect(result.getUTCMonth()).toBe(5); // junio = 5 (0-indexed)
      expect(result.getUTCDate()).toBe(15);
    });

    it('retorna null para formato inválido', () => {
      expect(service.analizarCadenaFechaGuionMedio('15/06/2024')).toBeNull();
      expect(service.analizarCadenaFechaGuionMedio('2024-13-01')).toBeNull();
      expect(service.analizarCadenaFechaGuionMedio('')).toBeNull();
    });

    it('retorna null para mes fuera de rango', () => {
      expect(service.analizarCadenaFechaGuionMedio('2024-00-15')).toBeNull();
      expect(service.analizarCadenaFechaGuionMedio('2024-13-15')).toBeNull();
    });

    it('retorna null para día fuera de rango', () => {
      expect(service.analizarCadenaFechaGuionMedio('2024-06-00')).toBeNull();
      expect(service.analizarCadenaFechaGuionMedio('2024-06-32')).toBeNull();
    });
  });
});
