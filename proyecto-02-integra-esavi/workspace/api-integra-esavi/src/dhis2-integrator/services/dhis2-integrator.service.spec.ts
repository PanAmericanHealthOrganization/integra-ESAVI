import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import { MeddraLLTService } from 'src/meddra/services/meddra-lt.service';
import { MeddraPtService } from 'src/meddra/services/meddra-pt.service';
import { IntegradorService } from '../../integrator/facade/integrador.service';
import { DuplicateAction, ProcessingStatus } from '../dto';
import { Dhis2DuplicateHandlerService } from './dhis2-duplicate-handler.service';
import { Dhis2EventsService } from './dhis2-events.service';
import { Dhis2IntegratorService } from './dhis2-integrator.service';
import { Dhis2ProcessingLogService } from './dhis2-processing-log.service';
import { Dhis2ProgramStageService } from './dhis2-program-stage.service';
import { Dhis2ProgramService } from './dhis2-program.service';

jest.mock('fs');

const mockHttpService = { get: jest.fn(), post: jest.fn() };
const mockIntegradorService = {
  create: jest.fn(),
};
const mockMeddraLltService = {
  buscarPorSimilitud: jest.fn(),
};
const mockMeddraPtService = {};
const mockDhis2ProgramService = {};
const mockDhis2ProgramStageService = {};
const mockDhis2EventsService = {
  getEventsReports: jest.fn(),
};
const mockProcessingLogService = {
  logImportStart: jest.fn(),
  createProcessingSummary: jest.fn(),
  getProcessingSummary: jest.fn(),
  logImportEnd: jest.fn(),
  logError: jest.fn(),
  logRecordProcessing: jest.fn(),
  updateProcessingSummary: jest.fn(),
};
const mockDuplicateHandlerService = {
  detectDuplicate: jest.fn(),
  handleDuplicate: jest.fn(),
};

describe('Dhis2IntegratorService', () => {
  let service: Dhis2IntegratorService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Dhis2IntegratorService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: IntegradorService, useValue: mockIntegradorService },
        { provide: MeddraLLTService, useValue: mockMeddraLltService },
        { provide: MeddraPtService, useValue: mockMeddraPtService },
        { provide: Dhis2ProgramService, useValue: mockDhis2ProgramService },
        { provide: Dhis2ProgramStageService, useValue: mockDhis2ProgramStageService },
        { provide: Dhis2EventsService, useValue: mockDhis2EventsService },
        { provide: Dhis2ProcessingLogService, useValue: mockProcessingLogService },
        { provide: Dhis2DuplicateHandlerService, useValue: mockDuplicateHandlerService },
      ],
    }).compile();
    service = module.get<Dhis2IntegratorService>(Dhis2IntegratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── formatoFecha ────────────────────────────────────────────────────────
  describe('formatoFecha', () => {
    it('retorna null si el valor es vacío/falsy', () => {
      expect(service.formatoFecha('')).toBeNull();
      expect(service.formatoFecha(undefined as any)).toBeNull();
    });

    it('parsea el formato ISO YYYY-MM-DD... entregado por el tracker API', () => {
      const date = service.formatoFecha('2024-03-15T00:00:00.000');
      expect(date.getUTCFullYear()).toBe(2024);
      expect(date.getUTCMonth()).toBe(2);
      expect(date.getUTCDate()).toBe(15);
    });

    it('parsea el formato compacto YYYYMMDD por compatibilidad con la antigua API', () => {
      const date = service.formatoFecha('20240315');
      expect(date.getUTCFullYear()).toBe(2024);
      expect(date.getUTCMonth()).toBe(2);
      expect(date.getUTCDate()).toBe(15);
    });

    it('retorna null si la fecha resultante es inválida', () => {
      expect(service.formatoFecha('abcdefgh')).toBeNull();
    });
  });

  // ─── formatoInteger / formatoFloat ───────────────────────────────────────
  describe('formatoInteger', () => {
    it('parsea un entero válido', () => {
      expect(service.formatoInteger('42')).toBe(42);
    });

    it('retorna 0 si el valor no es un número válido', () => {
      expect(service.formatoInteger('abc')).toBe(0);
    });

    it('retorna 0 si el valor es vacío', () => {
      expect(service.formatoInteger('')).toBe(0);
    });
  });

  describe('formatoFloat', () => {
    it('parsea un flotante válido', () => {
      expect(service.formatoFloat('3.14')).toBeCloseTo(3.14);
    });

    it('retorna 0 si el valor no es un número válido', () => {
      expect(service.formatoFloat('xyz')).toBe(0);
    });
  });

  // ─── transformDataFromApi ────────────────────────────────────────────────
  describe('transformDataFromApi', () => {
    it('transforma headers y rows, convirtiendo null/undefined/"" a null y el resto a string', async () => {
      const data = {
        headers: [
          { name: 'edad', column: 'Edad', valueType: 'INTEGER', type: 'string', hidden: false, meta: false },
        ],
        rows: [[null], [undefined], [''], [34], ['texto']],
      };

      const result = await service.transformDataFromApi(data);

      expect(result.headers).toHaveLength(1);
      expect(result.headers[0].column).toBe('Edad');
      expect(result.rows).toEqual([[null], [null], [null], ['34'], ['texto']]);
    });

    it('lanza un error si headers o rows no son arreglos', async () => {
      await expect(service.transformDataFromApi({ headers: null, rows: [] })).rejects.toThrow(
        'Estructura de datos inesperada',
      );
      await expect(service.transformDataFromApi({ headers: [], rows: null })).rejects.toThrow(
        'Estructura de datos inesperada',
      );
    });
  });

  // ─── revisarValorNulo ────────────────────────────────────────────────────
  describe('revisarValorNulo', () => {
    it('retorna DESCONOCIDO si el valor es null, undefined o vacío', () => {
      expect(service.revisarValorNulo(null)).toBe('DESCONOCIDO');
      expect(service.revisarValorNulo(undefined)).toBe('DESCONOCIDO');
      expect(service.revisarValorNulo('')).toBe('DESCONOCIDO');
    });

    it('retorna el valor tal cual si no es nulo/vacío', () => {
      expect(service.revisarValorNulo('Médico')).toBe('Médico');
    });
  });

  // ─── obtenerValorNumerico ────────────────────────────────────────────────
  describe('obtenerValorNumerico', () => {
    it('retorna 1 para "si" (sin distinguir mayúsculas y con espacios)', () => {
      expect(service.obtenerValorNumerico(' SI ')).toBe(1);
    });

    it('retorna 0 para "no"', () => {
      expect(service.obtenerValorNumerico('no')).toBe(0);
    });

    it('retorna 2 para "no sabe", "ignorando" o "desconoce"', () => {
      expect(service.obtenerValorNumerico('no sabe')).toBe(2);
      expect(service.obtenerValorNumerico('ignorando')).toBe(2);
      expect(service.obtenerValorNumerico('desconoce')).toBe(2);
    });

    it('retorna 2 por defecto para valores desconocidos o vacíos', () => {
      expect(service.obtenerValorNumerico('otro valor')).toBe(2);
      expect(service.obtenerValorNumerico(undefined as any)).toBe(2);
    });
  });

  // ─── separarCodigoYDescripcion ───────────────────────────────────────────
  describe('separarCodigoYDescripcion', () => {
    it('retorna codigo y descripcion vacíos si el texto es null/undefined/vacío', () => {
      expect(service.separarCodigoYDescripcion(null)).toEqual({ codigo: '', descripcion: '' });
      expect(service.separarCodigoYDescripcion(undefined)).toEqual({ codigo: '', descripcion: '' });
    });

    it('separa código y descripción cuando el texto coincide con el patrón', () => {
      expect(service.separarCodigoYDescripcion('A00 Cólera')).toEqual({
        codigo: 'A00',
        descripcion: 'Cólera',
      });
    });

    it('retorna solo descripcion (sin codigo) si el texto no matchea el patrón esperado', () => {
      // El regex siempre matchea al menos un caracter no espacio como código,
      // por lo que probamos con un texto compuesto solo por espacios.
      expect(service.separarCodigoYDescripcion('   ')).toEqual({ codigo: '', descripcion: '' });
    });
  });

  // ─── esValorAfirmativo / transformarTipoSoloSiDhis2 / transformarBooleanoSiNoDhis2 ──
  describe('esValorAfirmativo', () => {
    it('retorna true solo si el valor es exactamente "1"', () => {
      expect(service.esValorAfirmativo('1')).toBe(true);
      expect(service.esValorAfirmativo('0')).toBe(false);
      expect(service.esValorAfirmativo(undefined as any)).toBe(false);
    });
  });

  describe('transformarTipoSoloSiDhis2', () => {
    it('retorna "1" solo si el valor es exactamente "1", "0" en cualquier otro caso', () => {
      expect(service.transformarTipoSoloSiDhis2('1')).toBe('1');
      expect(service.transformarTipoSoloSiDhis2('0')).toBe('0');
      expect(service.transformarTipoSoloSiDhis2(undefined as any)).toBe('0');
    });
  });

  describe('transformarBooleanoSiNoDhis2', () => {
    it('retorna el valor convertido a string si es truthy', () => {
      expect(service.transformarBooleanoSiNoDhis2('1')).toBe('1');
    });

    it('retorna null si el valor es falsy', () => {
      expect(service.transformarBooleanoSiNoDhis2(undefined as any)).toBeNull();
      expect(service.transformarBooleanoSiNoDhis2('')).toBeNull();
    });
  });

  // ─── ajustarFecha ────────────────────────────────────────────────────────
  describe('ajustarFecha', () => {
    it('suma días a la fecha dada', () => {
      const fecha = new Date(Date.UTC(2024, 0, 1));
      const resultado = service.ajustarFecha(fecha, 10);
      expect(resultado.getUTCDate()).toBe(11);
    });

    it('resta días si el valor es negativo', () => {
      const fecha = new Date(Date.UTC(2024, 0, 15));
      const resultado = service.ajustarFecha(fecha, -14);
      expect(resultado.getUTCMonth()).toBe(0);
      expect(resultado.getUTCDate()).toBe(1);
    });
  });

  // ─── obtenerClasificacion ────────────────────────────────────────────────
  describe('obtenerClasificacion', () => {
    it('clasifica correctamente cada subcategoría de A', () => {
      const caso = 'A. Con asociación causal congruente con la vacuna o con el proceso de vacunación';
      expect(
        service.obtenerClasificacion(caso, 'A1. Evento relacionado con la vacuna o cualquiera de sus componentes'),
      ).toContain('A1');
      expect(
        service.obtenerClasificacion(caso, 'A2. Evento relacionado con una desviación de calidad de la vacuna'),
      ).toContain('A2');
      expect(
        service.obtenerClasificacion(caso, 'A3. Evento relacionado con un error programático'),
      ).toContain('A3');
      expect(service.obtenerClasificacion(caso, 'subcategoria-desconocida')).toBe(
        'Clasificación A -- Subcategoría no reconocida',
      );
    });

    it('clasifica correctamente cada subcategoría de B', () => {
      const caso = 'B. Indeterminado';
      expect(
        service.obtenerClasificacion(
          caso,
          'B1. La relación temporal es congruente, pero no hay suficiente evidencia definitiva para asignar la causalidad a la vacuna',
        ),
      ).toContain('B1');
      expect(service.obtenerClasificacion(caso, 'subcategoria-desconocida')).toBe(
        'Clasificación B -- Subcategoría no reconocida',
      );
    });

    it('clasifica C y D sin subcategoría', () => {
      expect(
        service.obtenerClasificacion(
          'C. Sin asociación causal congruente con la vacuna o la vacunación (evento coincidente)',
        ),
      ).toBe('C -- Causa coincidente');
      expect(service.obtenerClasificacion('D. No clasificable')).toBe('D -- No clasificable');
    });

    it('retorna clasificación no reconocida para un caso desconocido', () => {
      expect(service.obtenerClasificacion('caso-invalido')).toBe('Clasificación no reconocida');
    });
  });

  // ─── extractedFromDHIS2ToPersistWithDuplicateHandling ───────────────────
  describe('extractedFromDHIS2ToPersistWithDuplicateHandling', () => {
    const headers: any = [
      { column: 'Nro. de identificación' },
      { column: 'DNVE ESAVI TRK - Código del caso' },
    ];

    const buildRow = (identificacion: string, codigo: string | null) => [identificacion, codigo];

    it('omite y registra error si el registro no tiene código DHIS2', async () => {
      const data = { headers, rows: [buildRow('ID1', null)] };

      await service.extractedFromDHIS2ToPersistWithDuplicateHandling(data, 'LOTE1');

      expect(mockProcessingLogService.logRecordProcessing).toHaveBeenCalledWith(
        'LOTE1',
        'SIN_CODIGO',
        'ID1',
        ProcessingStatus.ERROR,
        expect.any(String),
        expect.any(String),
      );
      expect(mockDuplicateHandlerService.detectDuplicate).not.toHaveBeenCalled();
      expect(mockProcessingLogService.updateProcessingSummary).toHaveBeenCalledWith('LOTE1', {
        registrosProcesados: 0,
        registrosDuplicados: 0,
        registrosActualizados: 0,
        registrosOmitidos: 0,
        registrosConError: 1,
      });
    });

    it('procesa un registro nuevo (no duplicado) llamando a integradorService.create', async () => {
      const data = { headers, rows: [buildRow('ID2', 'COD2')] };
      mockDuplicateHandlerService.detectDuplicate.mockResolvedValue({ isDuplicate: false });
      mockIntegradorService.create.mockResolvedValue(undefined);

      await service.extractedFromDHIS2ToPersistWithDuplicateHandling(data, 'LOTE2');

      expect(mockDuplicateHandlerService.detectDuplicate).toHaveBeenCalledWith('COD2', 'ID2', 'LOTE2');
      expect(mockIntegradorService.create).toHaveBeenCalledTimes(1);
      expect(mockProcessingLogService.updateProcessingSummary).toHaveBeenCalledWith('LOTE2', {
        registrosProcesados: 1,
        registrosDuplicados: 0,
        registrosActualizados: 0,
        registrosOmitidos: 0,
        registrosConError: 0,
      });
    });

    it('cuenta como actualizado un duplicado resuelto con UPDATE_INDIVIDUAL', async () => {
      const data = { headers, rows: [buildRow('ID3', 'COD3')] };
      mockDuplicateHandlerService.detectDuplicate.mockResolvedValue({
        isDuplicate: true,
        reason: 'ya existe',
        existingRecord: { id: 'X' },
      });
      mockDuplicateHandlerService.handleDuplicate.mockResolvedValue({
        procesado: true,
        accionTomada: DuplicateAction.UPDATE_INDIVIDUAL,
      });

      await service.extractedFromDHIS2ToPersistWithDuplicateHandling(data, 'LOTE3');

      expect(mockIntegradorService.create).not.toHaveBeenCalled();
      expect(mockProcessingLogService.updateProcessingSummary).toHaveBeenCalledWith('LOTE3', {
        registrosProcesados: 0,
        registrosDuplicados: 1,
        registrosActualizados: 1,
        registrosOmitidos: 0,
        registrosConError: 0,
      });
    });

    it('cuenta como omitido un duplicado resuelto con SKIP', async () => {
      const data = { headers, rows: [buildRow('ID4', 'COD4')] };
      mockDuplicateHandlerService.detectDuplicate.mockResolvedValue({
        isDuplicate: true,
        reason: 'ya existe',
      });
      mockDuplicateHandlerService.handleDuplicate.mockResolvedValue({
        procesado: true,
        accionTomada: DuplicateAction.SKIP,
      });

      await service.extractedFromDHIS2ToPersistWithDuplicateHandling(data, 'LOTE4');

      expect(mockProcessingLogService.updateProcessingSummary).toHaveBeenCalledWith('LOTE4', {
        registrosProcesados: 0,
        registrosDuplicados: 1,
        registrosActualizados: 0,
        registrosOmitidos: 1,
        registrosConError: 0,
      });
    });

    it('cuenta como error un duplicado cuyo manejo no fue procesado', async () => {
      const data = { headers, rows: [buildRow('ID5', 'COD5')] };
      mockDuplicateHandlerService.detectDuplicate.mockResolvedValue({
        isDuplicate: true,
        reason: 'ya existe',
      });
      mockDuplicateHandlerService.handleDuplicate.mockResolvedValue({
        procesado: false,
        accionTomada: DuplicateAction.SKIP,
        error: 'fallo',
      });

      await service.extractedFromDHIS2ToPersistWithDuplicateHandling(data, 'LOTE5');

      expect(mockProcessingLogService.updateProcessingSummary).toHaveBeenCalledWith('LOTE5', {
        registrosProcesados: 0,
        registrosDuplicados: 1,
        registrosActualizados: 0,
        registrosOmitidos: 0,
        registrosConError: 1,
      });
    });

    it('captura errores inesperados durante el procesamiento del registro y continúa con el resumen', async () => {
      const headersConComorbilidad: any = [
        ...headers,
        { column: 'DNVE ESAVI TRK - Antecedente patológico personal 1' },
      ];
      const data = {
        headers: headersConComorbilidad,
        rows: [['ID6', 'COD6', 'K59 Estreñimiento']],
      };
      mockMeddraLltService.buscarPorSimilitud.mockRejectedValue(new Error('meddra caído'));

      await service.extractedFromDHIS2ToPersistWithDuplicateHandling(data, 'LOTE6');

      expect(mockProcessingLogService.logError).toHaveBeenCalledWith(
        'LOTE6',
        expect.stringContaining('meddra caído'),
        'meddra caído',
        'DESCONOCIDO',
        'DESCONOCIDO',
      );
      expect(mockProcessingLogService.updateProcessingSummary).toHaveBeenCalledWith('LOTE6', {
        registrosProcesados: 0,
        registrosDuplicados: 0,
        registrosActualizados: 0,
        registrosOmitidos: 0,
        registrosConError: 1,
      });
    });

    it('usa la config por defecto (UPDATE_INDIVIDUAL, sin confirmación) cuando no se provee duplicateConfig', async () => {
      const data = { headers, rows: [buildRow('ID7', 'COD7')] };
      mockDuplicateHandlerService.detectDuplicate.mockResolvedValue({ isDuplicate: true, reason: 'r' });
      mockDuplicateHandlerService.handleDuplicate.mockResolvedValue({
        procesado: true,
        accionTomada: DuplicateAction.UPDATE_INDIVIDUAL,
      });

      await service.extractedFromDHIS2ToPersistWithDuplicateHandling(data, 'LOTE7');

      expect(mockDuplicateHandlerService.handleDuplicate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        'LOTE7',
        expect.objectContaining({
          accionPorDefecto: DuplicateAction.UPDATE_INDIVIDUAL,
          confirmarAntesDeProcesar: false,
        }),
      );
    });
  });

  // ─── createInBulk ────────────────────────────────────────────────────────
  describe('createInBulk', () => {
    const headers: any = [
      { column: 'Nro. de identificación' },
      { column: 'DNVE ESAVI TRK - Código del caso' },
    ];
    const fechaInicio = new Date(Date.UTC(2024, 0, 1));
    const fechaFin = new Date(Date.UTC(2024, 0, 31));

    it('ejecuta el flujo completo: obtiene datos, transforma, persiste y registra fin de importación', async () => {
      mockDhis2EventsService.getEventsReports.mockResolvedValue({
        headers,
        rows: [['ID1', 'COD1']],
      });
      mockProcessingLogService.createProcessingSummary.mockReturnValue({
        fechaInicio: fechaInicio.toISOString(),
      });
      mockDuplicateHandlerService.detectDuplicate.mockResolvedValue({ isDuplicate: false });
      mockIntegradorService.create.mockResolvedValue(undefined);
      mockProcessingLogService.getProcessingSummary.mockReturnValue({
        registrosProcesados: 1,
        totalRegistros: 1,
      });

      await service.createInBulk(fechaInicio, fechaFin, 'J07');

      expect(mockProcessingLogService.logImportStart).toHaveBeenCalled();
      expect(mockDhis2EventsService.getEventsReports).toHaveBeenCalledWith('NrEU7cRCZd7', fechaInicio, fechaFin);
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(mockIntegradorService.create).toHaveBeenCalledTimes(1);
      expect(mockProcessingLogService.logImportEnd).toHaveBeenCalled();
    });

    it('crea el directorio de salida si no existe antes de escribir el archivo', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      mockDhis2EventsService.getEventsReports.mockResolvedValue({ headers, rows: [] });
      mockProcessingLogService.createProcessingSummary.mockReturnValue({
        fechaInicio: fechaInicio.toISOString(),
      });
      mockProcessingLogService.getProcessingSummary.mockReturnValue(undefined);

      await service.createInBulk(fechaInicio, fechaFin, 'J07');

      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('no falla si fs.writeFileSync lanza un error (se captura y solo se loguea en consola)', async () => {
      mockDhis2EventsService.getEventsReports.mockResolvedValue({ headers, rows: [] });
      mockProcessingLogService.createProcessingSummary.mockReturnValue({
        fechaInicio: fechaInicio.toISOString(),
      });
      mockProcessingLogService.getProcessingSummary.mockReturnValue(undefined);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('disco lleno');
      });

      await expect(service.createInBulk(fechaInicio, fechaFin, 'J07')).resolves.toBeUndefined();
    });

    it('propaga y registra el error si dhis2EventsService.getEventsReports falla', async () => {
      mockDhis2EventsService.getEventsReports.mockRejectedValue(new Error('DHIS2 no disponible'));

      await expect(service.createInBulk(fechaInicio, fechaFin, 'J07')).rejects.toThrow('DHIS2 no disponible');

      expect(mockProcessingLogService.logError).toHaveBeenCalledWith(
        expect.any(String),
        'Error durante la importación masiva',
        'DHIS2 no disponible',
      );
    });

    it('acepta y propaga un duplicateConfig explícito hacia el manejo de duplicados', async () => {
      mockDhis2EventsService.getEventsReports.mockResolvedValue({
        headers,
        rows: [['ID9', 'COD9']],
      });
      mockProcessingLogService.createProcessingSummary.mockReturnValue({
        fechaInicio: fechaInicio.toISOString(),
      });
      mockDuplicateHandlerService.detectDuplicate.mockResolvedValue({ isDuplicate: true, reason: 'r' });
      mockDuplicateHandlerService.handleDuplicate.mockResolvedValue({
        procesado: true,
        accionTomada: DuplicateAction.SKIP,
      });
      mockProcessingLogService.getProcessingSummary.mockReturnValue(undefined);

      const duplicateConfig = { accionPorDefecto: DuplicateAction.SKIP, confirmarAntesDeProcesar: false };
      await service.createInBulk(fechaInicio, fechaFin, 'J07', duplicateConfig);

      expect(mockDuplicateHandlerService.handleDuplicate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.any(String),
        duplicateConfig,
      );
    });
  });
});
