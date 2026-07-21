import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DimConsistenciaService } from './dim-consitencia';
import { DIMENSION_CALIDAD } from '../controllers/dto';

const mockDataSource = {
  query: jest.fn(),
};

const filaValida = (overrides: Record<string, any> = {}) => [
  {
    totalRegistros: '10',
    totalRegistrosValidos: '10',
    totalRegistrosNoValidos: '0',
    idNotificacionesNoValidos: [],
    ...overrides,
  },
];

const filaConErrores = (overrides: Record<string, any> = {}) => [
  {
    totalRegistros: '10',
    totalRegistrosValidos: '5',
    totalRegistrosNoValidos: '5',
    idNotificacionesNoValidos: ['n1'],
    ...overrides,
  },
];

describe('DimConsistenciaService', () => {
  let service: DimConsistenciaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DimConsistenciaService,
        { provide: getDataSourceToken('DATAQUALITY_DS'), useValue: mockDataSource },
      ],
    }).compile();
    service = module.get<DimConsistenciaService>(DimConsistenciaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processAll', () => {
    it('calcula la dimensión de consistencia con datos perfectos (camino feliz)', async () => {
      mockDataSource.query.mockResolvedValue(filaValida());

      const day = new Date('2026-07-15T00:00:00.000Z');
      const result = await service.processAll(day);

      expect(result.dimension).toBe(DIMENSION_CALIDAD.CONSISTENCIA);
      expect(result.calidadTotal).toBe(100);
      // mismos datos para mes actual y mes anterior => sin variación
      expect(result.deltaCalidadTotal).toBe(0);
      expect(Array.isArray(result.jsonDimensionQuality)).toBe(true);
      // 13 evaluaciones puntuales + 10 combinaciones tabla/columna de _noFechasFuturas
      expect(result.jsonDimensionQuality.length).toBe(23);
      expect(mockDataSource.query).toHaveBeenCalled();
    });

    it('calcula un delta distinto de cero cuando el mes actual mejora respecto al anterior', async () => {
      const day = new Date('2026-07-15T00:00:00.000Z');
      const previousMonth = new Date(day);
      previousMonth.setMonth(previousMonth.getMonth() - 1);

      mockDataSource.query.mockImplementation((sql: string) => {
        if (sql.includes(day.toISOString())) {
          return Promise.resolve(filaValida());
        }
        return Promise.resolve(filaConErrores());
      });

      const result = await service.processAll(day);

      expect(result.calidadTotal).toBe(100);
      expect(result.deltaCalidadTotal).toBeGreaterThan(0);
    });

    it('maneja resultados vacíos de la base de datos sin lanzar error (calidad 0)', async () => {
      mockDataSource.query.mockResolvedValue([]);

      const day = new Date('2026-07-15T00:00:00.000Z');
      const result = await service.processAll(day);

      expect(result.calidadTotal).toBe(0);
      expect(result.deltaCalidadTotal).toBe(0);
      expect(result.jsonDimensionQuality.length).toBe(23);
    });
  });
});
