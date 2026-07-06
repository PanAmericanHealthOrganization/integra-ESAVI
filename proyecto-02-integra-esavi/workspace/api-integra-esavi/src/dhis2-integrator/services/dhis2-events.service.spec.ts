import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { Dhis2EventsService } from './dhis2-events.service';
import { Dhis2DataElementService } from './dhis2-data-element.service';
import { Dhis2OptionsService } from './dhis2-options.service';
import { Dhis2ProgramService } from './dhis2-program.service';

const PROGRAMA = 'NrEU7cRCZd7';
const ORG_UNIT_RAIZ = 'CcPKoI4rpPZ';
const TAMANIO_PAGINA = 50;

const mockHttpService = { get: jest.fn() };

const mockConfigService = {
  get: jest.fn((key: string, defecto?: string) => {
    const valores: Record<string, string> = {
      DHIS2_URL: 'http://dhis2.test',
      DHIS2_USER_KEY: 'd2pat_prueba',
    };
    return valores[key] ?? defecto;
  }),
};

const mockDataElementService = { getDataElements: jest.fn() };
const mockOptionsService = { getOptionSets: jest.fn() };
const mockProgramService = { getTrackedEntityAttributesMetadata: jest.fn() };

/** Instancia cruda en el formato 2.36-2.40 del nuevo tracker API (clave "instances"). */
const teiApi = {
  trackedEntity: 'TEI001',
  attributes: [
    { attribute: 'ATTR_EDAD', displayName: 'Edad', value: '34' },
    { attribute: 'ATTR_SEXO', displayName: 'Sexo', value: 'SEX01' },
  ],
  enrollments: [
    {
      enrollment: 'ENR001',
      program: PROGRAMA,
      status: 'ACTIVE',
      orgUnit: 'OU001',
      enrolledAt: '2024-03-10T00:00:00.000',
      occurredAt: '2024-03-09T00:00:00.000',
      events: [
        // Evento más reciente al inicio para verificar que el orden por fecha prevalece
        {
          event: 'EV2',
          programStage: 'STG1',
          status: 'COMPLETED',
          occurredAt: '2024-03-12T00:00:00.000',
          dataValues: [{ dataElement: 'DE_ESTADO', value: 'valor final' }],
        },
        {
          event: 'EV1',
          programStage: 'STG1',
          status: 'COMPLETED',
          occurredAt: '2024-03-11T00:00:00.000',
          dataValues: [
            { dataElement: 'DE_GRAVE', value: 'true' },
            { dataElement: 'DE_ESTADO', value: 'valor viejo' },
          ],
        },
      ],
    },
    // Enrollment de otro programa: debe excluirse del reporte
    {
      enrollment: 'ENR002',
      program: 'OTRO_PROGRAMA',
      status: 'ACTIVE',
      orgUnit: 'OU001',
      enrolledAt: '2024-05-01T00:00:00.000',
      occurredAt: '2024-05-01T00:00:00.000',
      events: [],
    },
    // Enrollment fuera del rango de fechas: debe excluirse del reporte
    {
      enrollment: 'ENR003',
      program: PROGRAMA,
      status: 'ACTIVE',
      orgUnit: 'OU001',
      enrolledAt: '2010-01-01T00:00:00.000',
      occurredAt: '2010-01-01T00:00:00.000',
      events: [],
    },
  ],
};

const dataElementsMetadata = [
  { id: 'DE_GRAVE', name: 'DNVE ESAVI TRK - Caso grave', valueType: 'BOOLEAN' },
  { id: 'DE_ESTADO', name: 'DNVE ESAVI TRK - Estado', valueType: 'TEXT' },
];

const atributosMetadata = [
  { id: 'ATTR_EDAD', name: 'DNVE ESAVI TRK - Edad', valueType: 'INTEGER' },
  {
    id: 'ATTR_SEXO',
    name: 'DNVE ESAVI TRK - Sexo',
    valueType: 'TEXT',
    optionSet: { id: 'OS_SEXO' },
  },
];

const optionSets = [
  { id: 'OS_SEXO', options: [{ code: 'SEX01', name: 'Masculino' }] },
];

const organisationUnits = [
  { id: 'OU001', name: 'Centro de Salud Norte', code: 'CS-N-01' },
];

/** Configura el mock HTTP para responder al tracker y a organisationUnits. */
const configurarHttp = (paginasTracker: unknown[][], claveRespuesta = 'instances') => {
  mockHttpService.get.mockImplementation((uri: string) => {
    if (uri.includes('/api/tracker/trackedEntities.json')) {
      const pagina = Number(new URL(uri).searchParams.get('page'));
      return of({ data: { [claveRespuesta]: paginasTracker[pagina - 1] ?? [] } });
    }
    if (uri.includes('/api/organisationUnits.json')) {
      return of({ data: { organisationUnits } });
    }
    throw new Error(`URI no esperada en la prueba: ${uri}`);
  });
};

describe('Dhis2EventsService', () => {
  let service: Dhis2EventsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDataElementService.getDataElements.mockResolvedValue(dataElementsMetadata);
    mockProgramService.getTrackedEntityAttributesMetadata.mockResolvedValue(atributosMetadata);
    mockOptionsService.getOptionSets.mockResolvedValue(optionSets);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Dhis2EventsService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Dhis2DataElementService, useValue: mockDataElementService },
        { provide: Dhis2OptionsService, useValue: mockOptionsService },
        { provide: Dhis2ProgramService, useValue: mockProgramService },
      ],
    }).compile();
    service = module.get<Dhis2EventsService>(Dhis2EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getEventsReports ────────────────────────────────────────────────────

  describe('getEventsReports', () => {
    const fechaInicio = new Date(Date.UTC(2024, 0, 1));
    const fechaFin = new Date(Date.UTC(2024, 11, 31));

    it('consulta el tracker con los parámetros de DHIS2 2.40 (orgUnit/ouMode) y el rango de fechas', async () => {
      configurarHttp([[teiApi]]);

      await service.getEventsReports(PROGRAMA, fechaInicio, fechaFin);

      const uriTracker = mockHttpService.get.mock.calls
        .map(([uri]) => uri as string)
        .find((uri) => uri.includes('/api/tracker/trackedEntities.json'));
      expect(uriTracker).toContain(`orgUnit=${ORG_UNIT_RAIZ}`);
      expect(uriTracker).toContain('ouMode=DESCENDANTS');
      expect(uriTracker).toContain(`program=${PROGRAMA}`);
      expect(uriTracker).toContain('enrollmentEnrolledAfter=2024-01-01');
      expect(uriTracker).toContain('enrollmentEnrolledBefore=2024-12-31');
    });

    it('autentica cada petición con la cabecera ApiToken', async () => {
      configurarHttp([[teiApi]]);

      await service.getEventsReports(PROGRAMA, fechaInicio, fechaFin);

      for (const [, config] of mockHttpService.get.mock.calls) {
        expect(config.headers.Authorization).toBe('ApiToken d2pat_prueba');
      }
    });

    it('construye los headers con las columnas especiales, atributos y data elements', async () => {
      configurarHttp([[teiApi]]);

      const reporte = await service.getEventsReports(PROGRAMA, fechaInicio, fechaFin);

      const columnas = reporte.headers.map((header) => header.column);
      expect(columnas).toEqual(
        expect.arrayContaining([
          'Organisation unit name',
          'Organisation unit code',
          'Organisation unit',
          'Enrollment date',
          'Incident date',
          'DNVE ESAVI TRK - Edad',
          'DNVE ESAVI TRK - Sexo',
          'DNVE ESAVI TRK - Caso grave',
          'DNVE ESAVI TRK - Estado',
        ]),
      );
    });

    it('genera una fila por enrollment del programa dentro del rango, excluyendo el resto', async () => {
      configurarHttp([[teiApi]]);

      const reporte = await service.getEventsReports(PROGRAMA, fechaInicio, fechaFin);

      expect(reporte.rows).toHaveLength(1);
    });

    it('normaliza los valores como analytics: booleano a 1/0, opción a nombre y fechas sin T', async () => {
      configurarHttp([[teiApi]]);

      const reporte = await service.getEventsReports(PROGRAMA, fechaInicio, fechaFin);

      const valorDe = (columna: string) => {
        const indice = reporte.headers.findIndex((header) => header.column === columna);
        return reporte.rows[0][indice];
      };
      expect(valorDe('Organisation unit name')).toBe('Centro de Salud Norte');
      expect(valorDe('Organisation unit code')).toBe('CS-N-01');
      expect(valorDe('Enrollment date')).toBe('2024-03-10 00:00:00.000');
      expect(valorDe('Incident date')).toBe('2024-03-09 00:00:00.000');
      expect(valorDe('DNVE ESAVI TRK - Edad')).toBe('34');
      expect(valorDe('DNVE ESAVI TRK - Sexo')).toBe('Masculino');
      expect(valorDe('DNVE ESAVI TRK - Caso grave')).toBe('1');
    });

    it('cuando un stage tiene varios eventos prevalece el valor del evento más reciente', async () => {
      configurarHttp([[teiApi]]);

      const reporte = await service.getEventsReports(PROGRAMA, fechaInicio, fechaFin);

      const indice = reporte.headers.findIndex(
        (header) => header.column === 'DNVE ESAVI TRK - Estado',
      );
      expect(reporte.rows[0][indice]).toBe('valor final');
    });

    it('acepta la respuesta 2.41 bajo la clave trackedEntities', async () => {
      configurarHttp([[teiApi]], 'trackedEntities');

      const reporte = await service.getEventsReports(PROGRAMA, fechaInicio, fechaFin);

      expect(reporte.rows).toHaveLength(1);
    });

    it('pagina hasta agotar los resultados (página llena implica seguir consultando)', async () => {
      const crearTei = (indice: number) => ({
        trackedEntity: `TEI${indice}`,
        attributes: [],
        enrollments: [
          {
            enrollment: `ENR${indice}`,
            program: PROGRAMA,
            status: 'ACTIVE',
            orgUnit: 'OU001',
            enrolledAt: '2024-06-01T00:00:00.000',
            occurredAt: '2024-06-01T00:00:00.000',
            events: [],
          },
        ],
      });
      const paginaLlena = Array.from({ length: TAMANIO_PAGINA }, (_, i) => crearTei(i));
      const paginaFinal = [crearTei(TAMANIO_PAGINA)];
      configurarHttp([paginaLlena, paginaFinal]);
      mockDataElementService.getDataElements.mockResolvedValue([]);
      mockProgramService.getTrackedEntityAttributesMetadata.mockResolvedValue([]);
      mockOptionsService.getOptionSets.mockResolvedValue([]);

      const reporte = await service.getEventsReports(PROGRAMA, fechaInicio, fechaFin);

      const llamadasTracker = mockHttpService.get.mock.calls.filter(([uri]) =>
        (uri as string).includes('/api/tracker/trackedEntities.json'),
      );
      expect(llamadasTracker).toHaveLength(2);
      expect(reporte.rows).toHaveLength(TAMANIO_PAGINA + 1);
    });

    it('propaga los errores del API como HttpException con el estado original', async () => {
      const errorAxios = {
        response: { data: { message: 'Unauthorized' }, status: 401 },
      } as AxiosError;
      mockHttpService.get.mockReturnValue(throwError(() => errorAxios));

      await expect(service.getEventsReports(PROGRAMA, fechaInicio, fechaFin)).rejects.toThrow(
        HttpException,
      );
    });
  });
});
