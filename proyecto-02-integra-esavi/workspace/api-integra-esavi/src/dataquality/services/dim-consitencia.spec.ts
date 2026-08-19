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
      // 13 evaluaciones puntuales + 9 combinaciones tabla/columna de _noFechasFuturas
      // (TR_PACIENTE.FECHA_NACIMIENTO estaba listada dos veces y generaba una regla repetida)
      expect(result.jsonDimensionQuality.length).toBe(22);
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
      expect(result.jsonDimensionQuality.length).toBe(22);
    });
  });

  describe('_noFechasFuturas - id agregado en el detalle', () => {
    /**
     * qualityProblems resuelve idNotificacionesNoValidos contra TR_NOTIFICACION. Cuando la
     * regla evalúa otra tabla debe agregar su NOTIFICACION_ID —o llegar por join, en el caso
     * de TR_PACIENTE—, porque agregar el PK propio deja el detalle vacío.
     */
    // `filter (where tp."<columna>" > tp."AUD_FECHA_CREACION")` es la firma de _noFechasFuturas;
    // sin ella el selector también recogería los queries de las reglas de fechas mínimas.
    const queryDe = (tabla: string, columna: string): string =>
      mockDataSource.query.mock.calls
        .map((call) => call[0] as string)
        .find(
          (q) =>
            q.includes(`"DHI_ESAVI"."${tabla}"`) &&
            q.includes(`filter (where tp."${columna}" > tp."AUD_FECHA_CREACION")`),
        ) ?? '';

    beforeEach(async () => {
      mockDataSource.query.mockResolvedValue(filaConErrores());
      await service.processAll(new Date('2026-07-15T00:00:00.000Z'));
    });

    it.each([
      ['TR_DESENLACE_ESAVI', 'FECHAMUERTE'],
      ['TR_DESENLACE_ESAVI', 'FECHANOTIFICAMUERTE'],
      ['TR_ESAVI_DURANTE_EMBARAZO', 'FECHAULTIMAMENSTRUACIONESAVI'],
      ['TR_DATO_VACUNACION', 'FECHA_VACUNACION'],
    ])('%s.%s agrega NOTIFICACION_ID y no el PK propio', (tabla, columna) => {
      const query = queryDe(tabla, columna);

      expect(query).toContain('json_agg(DISTINCT tp."NOTIFICACION_ID")');
      expect(query).not.toContain('json_agg(DISTINCT tp."ID")');
    });

    it('TR_PACIENTE.FECHA_NACIMIENTO llega a la notificación por join', () => {
      const query = queryDe('TR_PACIENTE', 'FECHA_NACIMIENTO');

      expect(query).toContain('inner join "DHI_ESAVI"."TR_NOTIFICACION" tp_noti');
      expect(query).toContain('json_agg(DISTINCT tp_noti."ID")');
    });

    it('TR_NOTIFICACION sigue agregando su propio ID', () => {
      const query = queryDe('TR_NOTIFICACION', 'FECHA_ATENCION');

      expect(query).toContain('json_agg(DISTINCT tp."ID")');
    });

    /**
     * La ventana de evaluación es la fecha del hecho. AUD_FECHA_CREACION guarda cuándo el
     * integrador insertó la fila y, con carga retroactiva, siempre es posterior al periodo
     * evaluado: filtrar por ella dejaba todas estas reglas en cero registros.
     */
    it('ninguna regla acota el periodo por la fecha de carga', () => {
      const queries = mockDataSource.query.mock.calls.map((call) => call[0] as string);

      expect(queries.length).toBeGreaterThan(0);
      queries.forEach((query) => {
        expect(query).not.toMatch(/"AUD_FECHA_CREACION" <= '/);
      });
    });
  });
});
