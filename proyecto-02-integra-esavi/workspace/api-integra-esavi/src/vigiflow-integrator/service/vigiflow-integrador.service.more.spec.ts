import { BadRequestException, Logger } from '@nestjs/common';
import { utils, WorkBook } from 'xlsx';
import * as fsPromises from 'fs/promises';
import * as xlsxModule from 'xlsx';
import { SyncStatus } from 'src/integrator/entity';
import { VigiflowUtils } from '../utils/vigiflow-utils.module';
import { VigiflowIntegradorService } from './vigiflow-integrador.service';

// Se mockea el filesystem para createInBulkFromFile: nunca se debe leer un archivo real.
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

// Se mockea únicamente `read` de xlsx (usado para parsear buffers/archivos); `utils` se mantiene
// real para poder construir libros de prueba con aoa_to_sheet/book_new, igual que en el resto del módulo.
jest.mock('xlsx', () => {
  const actual = jest.requireActual('xlsx');
  return {
    ...actual,
    read: jest.fn(),
  };
});

/**
 * ---- Helpers de construcción de hojas de cálculo (sin depender de archivos reales) ----
 * Convención de columnas de Excel: A=0, B=1 ... Z=25, AA=26 ... AM=38, etc. (base-26, A=1).
 */
function colIndex(col: string): number {
  let idx = 0;
  for (const ch of col) idx = idx * 26 + (ch.charCodeAt(0) - 64);
  return idx - 1;
}

// Ancho mínimo de fila: garantiza que todas las filas de una hoja (incluida la de encabezado)
// cubran el mismo rango de columnas, para que `defval: ''` aplique de forma consistente en
// columnas no usadas explícitamente por una fila puntual (p.ej. columna AQ en una fila que solo
// define hasta la columna W). Sin este mínimo, xlsx calcula el rango de la hoja en base a la
// columna más lejana escrita en CUALQUIER fila, y columnas más allá del ancho de una fila puntual
// quedarían fuera de esa fila (undefined) en lugar de aplicar el valor por defecto.
const MIN_ROW_LEN = 50;

function rowFromCols(cols: Record<string, any>): any[] {
  let maxIdx = 0;
  for (const col of Object.keys(cols)) maxIdx = Math.max(maxIdx, colIndex(col));
  const row = new Array(Math.max(maxIdx + 1, MIN_ROW_LEN)).fill('');
  for (const [col, val] of Object.entries(cols)) row[colIndex(col)] = val;
  return row;
}

/** Construye un WorkBook cuya hoja de interés está en `index`, rellenando hojas vacías previas. */
function sheetAt(index: number, rows: any[][]): WorkBook {
  const wb = utils.book_new();
  for (let i = 0; i < index; i++) {
    utils.book_append_sheet(wb, utils.aoa_to_sheet([]), `Hoja${i}`);
  }
  utils.book_append_sheet(wb, utils.aoa_to_sheet(rows), `Hoja${index}`);
  return wb;
}

/** Libro "vacío" con 4 hojas (usado como reportTwo) para pruebas de flujo/plomería. */
function emptyReportTwo(): WorkBook {
  const wb = utils.book_new();
  for (let i = 0; i < 4; i++) {
    utils.book_append_sheet(wb, utils.aoa_to_sheet([]), `Hoja${i}`);
  }
  return wb;
}

/** Libro "vacío" de una sola hoja (usado como reportOne). */
function emptyReportOne(): WorkBook {
  const wb = utils.book_new();
  utils.book_append_sheet(wb, utils.aoa_to_sheet([]), 'Hoja0');
  return wb;
}

describe('VigiflowIntegradorService (cobertura ampliada)', () => {
  const mockCrawler = {
    retrieveJWT: jest.fn().mockResolvedValue({ jwt: 'token-abc' }),
    retrieveExcelReport: jest.fn().mockResolvedValue(emptyReportOne()),
    retrieveJsonReport: jest.fn().mockResolvedValue(emptyReportTwo()),
  };
  const mockConfig = {
    get: jest.fn((key: string, def?: any) => def),
  };
  const mockIntegrador = { create: jest.fn().mockResolvedValue(undefined) };
  const mockPaciente = {
    findByCodigosOrigen: jest.fn().mockResolvedValue(new Map()),
    findAll: jest.fn().mockResolvedValue([]),
  };
  const mockNotifVigiflow = {
    findAllByCodigosOrigen: jest.fn().mockResolvedValue(new Map()),
    preloadBulk: jest.fn().mockResolvedValue(undefined),
    clearBulkCache: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    matchYGrabarEstablecimiento: jest.fn().mockResolvedValue(undefined),
  };
  const mockNotificador = {
    createOrUpdateFromVigiflow: jest.fn().mockResolvedValue({ id: 'notificador-1' }),
  };
  const mockMedicamento = {
    preloadByNotificacionIds: jest.fn().mockResolvedValue(undefined),
    createOneToOne: jest.fn().mockResolvedValue(undefined),
    clearMedicamentosCache: jest.fn(),
  };
  const mockEmbarazoEsavi = { create: jest.fn().mockResolvedValue(undefined) };
  const mockDesenlaceEsavi = { create: jest.fn().mockResolvedValue(undefined) };
  const mockGravedadEsavi = { create: jest.fn().mockResolvedValue(undefined) };
  const mockDatoVacuna = {
    preloadByNotificacionIds: jest.fn().mockResolvedValue(undefined),
    clearDatoVacunaCache: jest.fn(),
    findByNotifIdDtoMinimo: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue(undefined),
    invalidateMinimoEntry: jest.fn(),
    createByNotificacion: jest.fn().mockResolvedValue(undefined),
  };
  const mockDatoVacunacion = { create: jest.fn().mockResolvedValue(undefined) };
  const mockDatoEsavi = { createVigiflow: jest.fn().mockResolvedValue(undefined) };
  const mockDrug = { getDrugsOnly: jest.fn().mockResolvedValue([]) };
  const mockMaholder = { getMaholderOfDrug: jest.fn().mockResolvedValue([]) };
  const mockActiveIngredient = {
    getActiveIngredentsOfDrug: jest.fn().mockResolvedValue([]),
    getIngredientTranslation: jest.fn().mockResolvedValue(null),
  };
  const mockIngredientTranslation = {
    findVaccineByIngredientAndMaholder: jest.fn().mockResolvedValue(null),
  };
  const mockSync = {
    createSyncProcess: jest.fn().mockResolvedValue({ id: 'sync-id-1' }),
    update: jest.fn().mockResolvedValue(undefined),
  };
  // buscarPorSimilitud devuelve la fila completa del LLT: de ahí salen CODIGO_ESAVI_MEDDRA_LLT
  // (code) y CODIGO_ESAVI_CIE10 (icd10Code) en una sola consulta.
  const mockMeddraLlt = {
    buscarCodigoPorSimilitud: jest.fn().mockResolvedValue(null),
    buscarPorSimilitud: jest.fn().mockResolvedValue(null),
  };
  const mockMeddraPt = { searchPT: jest.fn().mockResolvedValue(null) };
  const mockMeddraSoc = { searchSOC: jest.fn().mockResolvedValue(null) };

  function createService(configOverrides: Record<string, any> = {}) {
    mockConfig.get.mockImplementation((key: string, def?: any) =>
      Object.prototype.hasOwnProperty.call(configOverrides, key) ? configOverrides[key] : def,
    );
    return new VigiflowIntegradorService(
      mockCrawler as any,
      mockConfig as any,
      mockIntegrador as any,
      mockPaciente as any,
      mockNotifVigiflow as any,
      mockNotificador as any,
      mockMedicamento as any,
      mockEmbarazoEsavi as any,
      mockDesenlaceEsavi as any,
      mockGravedadEsavi as any,
      mockDatoVacuna as any,
      mockDatoVacunacion as any,
      mockDatoEsavi as any,
      mockDrug as any,
      mockMaholder as any,
      mockActiveIngredient as any,
      mockIngredientTranslation as any,
      mockSync as any,
      mockMeddraLlt as any,
      mockMeddraPt as any,
      mockMeddraSoc as any,
    );
  }

  let sleepSpy: jest.SpyInstance;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined as any);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined as any);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined as any);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Evita esperas reales de "sleep" entre etapas del pipeline.
    sleepSpy = jest.spyOn(VigiflowUtils, 'sleep').mockResolvedValue(undefined);
    // Restaurar valores por defecto que dependen de instancias mutables (Map/Array nuevos por test).
    mockCrawler.retrieveJWT.mockResolvedValue({ jwt: 'token-abc' });
    mockCrawler.retrieveExcelReport.mockResolvedValue(emptyReportOne());
    mockCrawler.retrieveJsonReport.mockResolvedValue(emptyReportTwo());
    mockSync.createSyncProcess.mockResolvedValue({ id: 'sync-id-1' });
    mockPaciente.findByCodigosOrigen.mockResolvedValue(new Map());
    mockPaciente.findAll.mockResolvedValue([]);
    mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValue(new Map());
    mockDatoVacuna.findByNotifIdDtoMinimo.mockResolvedValue([]);
    mockDrug.getDrugsOnly.mockResolvedValue([]);
    mockMaholder.getMaholderOfDrug.mockResolvedValue([]);
    mockActiveIngredient.getActiveIngredentsOfDrug.mockResolvedValue([]);
    mockIngredientTranslation.findVaccineByIngredientAndMaholder.mockResolvedValue(null);
    mockMeddraLlt.buscarCodigoPorSimilitud.mockResolvedValue(null);
    mockMeddraPt.searchPT.mockResolvedValue(null);
    mockMeddraSoc.searchSOC.mockResolvedValue(null);
  });

  afterEach(() => {
    sleepSpy.mockRestore();
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------------------
  describe('constructor', () => {
    it('usa la fecha de inicio por defecto cuando no hay configuración', () => {
      const service = createService();
      expect((service as any).originalFechaInicio).toEqual(new Date('2024-11-01T00:00:00.000Z'));
      expect((service as any).fechaInicio).toEqual((service as any).originalFechaInicio);
    });

    it('usa la fecha de inicio configurada por variable de entorno', () => {
      const service = createService({ VIGIFLOW_FECHA_INICIO_CRON: '2025-02-01' });
      expect((service as any).originalFechaInicio).toEqual(new Date('2025-02-01T00:00:00.000Z'));
    });
  });

  // ---------------------------------------------------------------------------------------
  describe('createInBulk', () => {
    it('lanza BadRequestException si fechaFin <= fechaInicio', async () => {
      const service = createService();
      await expect(
        service.createInBulk(new Date('2024-02-01'), new Date('2024-01-01')),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockSync.createSyncProcess).not.toHaveBeenCalled();
    });

    it('camino feliz: formatea fechas, descarga reportes y marca el sync como COMPLETED', async () => {
      const service = createService();
      const fechaInicio = new Date(Date.UTC(2024, 0, 1));
      const fechaFin = new Date(Date.UTC(2024, 0, 31));

      await service.createInBulk(fechaInicio, fechaFin, 'J07');

      expect(mockSync.createSyncProcess).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'VIGIFLOW_BULK', status: SyncStatus.RUNNING }),
      );
      expect(mockCrawler.retrieveJWT).toHaveBeenCalled();
      expect(mockCrawler.retrieveExcelReport).toHaveBeenCalledWith('20240101', '20240131', 'J07', 'token-abc');
      expect(mockCrawler.retrieveJsonReport).toHaveBeenCalledWith('20240101', '20240131', 'J07', 'token-abc');
      expect(mockSync.update).toHaveBeenCalledWith(
        'sync-id-1',
        expect.objectContaining({ status: SyncStatus.COMPLETED }),
      );
    });

    it('marca el sync como FAILED y relanza el error cuando falla el pipeline (Error real)', async () => {
      const service = createService();
      const err = new Error('fallo de red');
      mockCrawler.retrieveExcelReport.mockRejectedValueOnce(err);

      await expect(
        service.createInBulk(new Date(Date.UTC(2024, 0, 1)), new Date(Date.UTC(2024, 0, 31))),
      ).rejects.toThrow('fallo de red');

      expect(mockSync.update).toHaveBeenCalledWith(
        'sync-id-1',
        expect.objectContaining({
          status: SyncStatus.FAILED,
          errorMessage: 'fallo de red',
          errorStack: err.stack,
        }),
      );
    });

    it('usa fallbacks de mensaje/stack cuando se lanza un valor que no es Error', async () => {
      const service = createService();
      mockCrawler.retrieveJWT.mockRejectedValueOnce('cadena de error plana');

      await expect(
        service.createInBulk(new Date(Date.UTC(2024, 0, 1)), new Date(Date.UTC(2024, 0, 31))),
      ).rejects.toBe('cadena de error plana');

      expect(mockSync.update).toHaveBeenCalledWith(
        'sync-id-1',
        expect.objectContaining({
          status: SyncStatus.FAILED,
          errorMessage: 'cadena de error plana',
          errorStack: null,
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------------------
  describe('createInBulkFromFile', () => {
    it('lee los archivos configurados, los parsea y ejecuta el pipeline completo', async () => {
      const service = createService({
        VIGIFLOW_FILE_AEFI: '/ruta/aefi.xlsx',
        VIGIFLOW_FILE_REPORT: '/ruta/report.xlsx',
      });
      (fsPromises.readFile as jest.Mock).mockResolvedValue(Buffer.from('dummy'));
      const wbAefi = emptyReportOne();
      const wbReport = emptyReportTwo();
      (xlsxModule.read as jest.Mock).mockReturnValueOnce(wbAefi).mockReturnValueOnce(wbReport);

      await service.createInBulkFromFile();

      expect(fsPromises.readFile).toHaveBeenCalledWith('/ruta/aefi.xlsx');
      expect(fsPromises.readFile).toHaveBeenCalledWith('/ruta/report.xlsx');
      expect(mockSync.createSyncProcess).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'VIGIFLOW_BULK_FILE' }),
      );
      expect(mockSync.update).toHaveBeenCalledWith(
        'sync-id-1',
        expect.objectContaining({
          status: SyncStatus.COMPLETED,
          message: 'Importación VigiFlow desde archivo completada',
        }),
      );
    });
  });

  describe('createInBulkFromUploadedFiles', () => {
    it('parsea los buffers recibidos y ejecuta el pipeline completo', async () => {
      const service = createService();
      const wbAefi = emptyReportOne();
      const wbReport = emptyReportTwo();
      (xlsxModule.read as jest.Mock).mockReturnValueOnce(wbAefi).mockReturnValueOnce(wbReport);

      await service.createInBulkFromUploadedFiles(Buffer.from('a'), Buffer.from('b'));

      expect(mockSync.createSyncProcess).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'VIGIFLOW_BULK_UPLOAD' }),
      );
      expect(mockSync.update).toHaveBeenCalledWith(
        'sync-id-1',
        expect.objectContaining({ status: SyncStatus.COMPLETED }),
      );
    });
  });

  // ---------------------------------------------------------------------------------------
  describe('crearAuditoria', () => {
    it('genera un objeto de auditoría con los valores por defecto de sistema', () => {
      const service = createService();
      const auditoria = (service as any).crearAuditoria();
      expect(auditoria.createdBy).toBe('System');
      expect(auditoria.updatedBy).toBe('System');
      expect(auditoria.deletedBy).toBe('System');
      expect(auditoria.isEnabled).toBe(true);
      expect(auditoria.isActive).toBe(true);
      expect(auditoria.createdAt).toBeInstanceOf(Date);
    });
  });

  // ---------------------------------------------------------------------------------------
  describe('extractedFromExcelToPersist (hoja AEFI)', () => {
    function invoke(service: any, dataRow: any[], codigosJ07: Set<string>) {
      const wb = sheetAt(0, [rowFromCols({}), dataRow]);
      return service.extractedFromExcelToPersist(wb, codigosJ07);
    }

    it('camino feliz: construye el DTO completo con todas las ramas afirmativas', async () => {
      const service: any = createService();
      const row = rowFromCols({
        B: 'EC-001',
        C: 'juan perez',
        D: 'Provincia de Pichincha',
        E: ' 0102030405 ',
        F: 'M',
        G: '19900115',
        H: '30',
        I: 'años',
        J: 'Si',
        N: '20230510',
        O: 'Dosis 2',
        X: 'No',
        Q: 'Diluyente X',
        R: 'LOTE-DIL-9',
        AA: 'si', // eliminarTildes no cambia mayúsculas/minúsculas; el código compara contra 'si' en minúscula
        AB: 'Dr. Reportador',
        AC: 'Provincia del Guayas',
        AD: '20230501',
        AE: '20230502',
        AF: 'Hospital Central',
        AL: '202305',
      });

      await invoke(service, row, new Set(['EC-001']));

      expect(mockIntegrador.create).toHaveBeenCalledTimes(1);
      const [createDto] = mockIntegrador.create.mock.calls[0];

      expect(createDto.pacienteVigiflow.codigoVigiflow).toBe('EC-001');
      expect(createDto.pacienteVigiflow.inicialesNombre).toBe('JUAN PEREZ');
      expect(createDto.notificacion.residenciaPaciente.provincia).toBe('PICHINCHA');
      expect(createDto.notificacion.residenciaNotificador.provincia).toBe('GUAYAS');
      expect(createDto.notificacion.edad).toBe(30);
      expect(createDto.notificacion.unidadEdadPaciente).toBe('AÑOS');
      expect(createDto.notificacion.fechaNotificacion).toEqual(new Date(Date.UTC(2023, 4, 1)));
      expect(createDto.notificacion.fechaReporteNacional).toEqual(new Date(Date.UTC(2023, 4, 2)));
      expect(createDto.gravedadEsavi.tipo).toBe('0');
      // Las banderas de gravedad ya no salen de esta hoja: se resuelven desde "Criterio (s) de
      // Gravedad" al procesar la hoja Reacciones.
      expect(createDto.gravedadEsavi.muerte).toBeUndefined();
      expect(createDto.gravedadEsavi.hospitalizacion).toBeUndefined();
      expect(createDto.desenlaceEsavi.autopsia).toBe(1);
      // La fecha de investigación pasó a TR_INVESTIGACION (col AL, "Fecha prevista de investigación")
      expect(createDto.investigacion.fechaInvestigacion).toEqual(new Date(Date.UTC(2023, 4, 15)));
      expect(createDto.datoVacunacion.nombreVacunatorio).toBe('Hospital Central');
      expect(createDto.datoVacuna.numeroDosisVacuna).toBe(2);
      expect(createDto.datoVacuna.nombreDiluyenteVacuna).toBe('Diluyente X');
      expect(createDto.datoVacuna.numeroLoteDiluyente).toBe('LOTE-DIL-9');
      expect(createDto.pacienteEmbarazada.momentoEsavi).toBe('1');
      expect(createDto.source).toBe('VIGIFLOW');

      expect(mockDatoVacuna.clearDatoVacunaCache).toHaveBeenCalled();
    });

    it('procesa también los casos graves, registrando TIPO_GRAVEDAD = 1', async () => {
      const service: any = createService();
      // Valor real de la columna X en la hoja AEFI: "Sí" con tilde, repetido por evento.
      const row = rowFromCols({ B: 'EC-GRAVE', X: 'Sí\r\nSí' });

      await invoke(service, row, new Set(['EC-GRAVE']));

      expect(mockIntegrador.create).toHaveBeenCalledTimes(1);
      const [createDto] = mockIntegrador.create.mock.calls[0];
      expect(createDto.gravedadEsavi.tipo).toBe('1');
    });

    it('un valor de gravedad que no es "Sí"/"No" no marca el caso como grave', async () => {
      const service: any = createService();
      const row = rowFromCols({ B: 'EC-SIN-DATO', X: 'Sin dato' });

      await invoke(service, row, new Set(['EC-SIN-DATO']));

      const [createDto] = mockIntegrador.create.mock.calls[0];
      expect(createDto.gravedadEsavi.tipo).toBe('0');
    });

    it('rama de edad/fechas inválidas y valores por defecto', async () => {
      const service: any = createService();
      const row = rowFromCols({
        B: 'EC-002',
        H: 'no-es-numero',
        I: '',
        G: 'fecha-invalida',
        AD: '',
        AE: '',
        X: 'No',
        Y: '',
        AA: '',
        J: 'No',
      });

      await invoke(service, row, new Set(['EC-002']));

      const [createDto] = mockIntegrador.create.mock.calls[0];
      expect(createDto.notificacion.edad).toBeNull();
      expect(createDto.notificacion.unidadEdadPaciente).toBeNull();
      expect(createDto.notificacion.residenciaPaciente.provincia).toBe('DESCONOCIDO');
      expect(createDto.notificacion.residenciaNotificador.provincia).toBe('DESCONOCIDO');
      expect(createDto.gravedadEsavi.tipo).toBe('0');
      expect(createDto.desenlaceEsavi.autopsia).toBe(2);
      expect(createDto.pacienteEmbarazada).toBeUndefined();
    });

    it('descarta por completo el caso cuando el paciente no tiene ninguna vacuna J07', async () => {
      const service: any = createService();
      const row = rowFromCols({ B: 'EC-SIN-J07', X: 'No' });

      await invoke(service, row, new Set(['EC-OTRO']));

      expect(mockIntegrador.create).not.toHaveBeenCalled();
    });

    it('descarta el caso cuando la fila no trae código VigiFlow (no verificable contra Medicamentos)', async () => {
      const service: any = createService();
      const row = rowFromCols({ B: '', X: 'No' });

      await invoke(service, row, new Set(['EC-001']));

      expect(mockIntegrador.create).not.toHaveBeenCalled();
    });

    it('autopsia "No" se traduce a 0', async () => {
      const service: any = createService();
      const row = rowFromCols({ B: 'EC-003', AA: 'no' });

      await invoke(service, row, new Set(['EC-003']));

      const [createDto] = mockIntegrador.create.mock.calls[0];
      expect(createDto.desenlaceEsavi.autopsia).toBe(0);
    });

    it('reutiliza paciente/notificación existentes cuando ya están precargados', async () => {
      const service: any = createService();
      const pacienteExistente = { id: 'p-1' };
      const notificacionExistente = { id: 'n-1' };
      mockPaciente.findByCodigosOrigen.mockResolvedValueOnce(new Map([['EC-004', pacienteExistente]]));
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(
        new Map([['EC-004', [notificacionExistente]]]),
      );
      const row = rowFromCols({ B: 'EC-004' });

      await invoke(service, row, new Set(['EC-004']));

      expect(mockIntegrador.create).toHaveBeenCalledWith(
        expect.anything(),
        pacienteExistente,
        notificacionExistente,
      );
    });

    it('propaga el error y limpia la caché de datoVacuna en el finally', async () => {
      const service: any = createService();
      mockIntegrador.create.mockRejectedValueOnce(new Error('fallo de persistencia'));
      const row = rowFromCols({ B: 'EC-005' });

      await expect(invoke(service, row, new Set(['EC-005']))).rejects.toThrow('fallo de persistencia');
      expect(mockDatoVacuna.clearDatoVacunaCache).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------------------
  describe('extractedFromJsonReportToUpdate (hoja Reportes)', () => {
    it('detecta dinámicamente la columna de organización y actualiza notificación + notificador + establecimiento', async () => {
      const service = createService();
      const notificacion = { id: 'n-1', origenOriginal: { reportadoPor: 'Dr X' } };
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-001' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map([['EC-001', [notificacion]]]));

      const headerRow = rowFromCols({ K: 'Organización (Emisor)' });
      const dataRow = rowFromCols({
        G: 'EC-001',
        AC: 'Caso narrativo de prueba',
        AQ: 'MEDICO\notro dato',
        N: 'Inicial',
        J: '20230101',
        F: 'Público',
        AA: '70.5',
        AB: '1.75',
        W: '12345',
        K: 'Hospital ABC',
      });
      const wb = sheetAt(1, [headerRow, dataRow]);

      await service.extractedFromJsonReportToUpdate(wb);

      expect(mockNotifVigiflow.update).toHaveBeenCalledWith(
        notificacion,
        expect.objectContaining({
          id: 'n-1',
          casoNarrativo: 'Caso narrativo de prueba',
          profesionNotificadorParam: 'MEDICO',
          tipoReporte: 'Inicial',
          tipoEmisor: 'Público',
        }),
        { id: 'notificador-1' },
      );
      expect(mockNotificador.createOrUpdateFromVigiflow).toHaveBeenCalledWith('12345', 'MEDICO', 'Dr X');
      expect(mockNotifVigiflow.matchYGrabarEstablecimiento).toHaveBeenCalledWith('n-1', 'Hospital ABC');
      expect(mockNotifVigiflow.preloadBulk).toHaveBeenCalled();
      expect(mockNotifVigiflow.clearBulkCache).toHaveBeenCalled();
    });

    it('omite la fila cuando no se encuentra el paciente', async () => {
      const service = createService();
      mockPaciente.findAll.mockResolvedValueOnce([]);
      const dataRow = rowFromCols({ G: 'EC-DESCONOCIDO' });
      const wb = sheetAt(1, [[], dataRow]);

      await service.extractedFromJsonReportToUpdate(wb);

      expect(mockNotifVigiflow.update).not.toHaveBeenCalled();
    });

    it('omite la fila cuando el paciente no tiene notificación asociada', async () => {
      const service = createService();
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-002' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map());
      const dataRow = rowFromCols({ G: 'EC-002' });
      const wb = sheetAt(1, [[], dataRow]);

      await service.extractedFromJsonReportToUpdate(wb);

      expect(mockNotifVigiflow.update).not.toHaveBeenCalled();
    });

    it('si falla la creación del notificador, continúa la actualización con notificador nulo', async () => {
      const service = createService();
      const notificacion = { id: 'n-3', origenOriginal: {} };
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-003' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map([['EC-003', [notificacion]]]));
      mockNotificador.createOrUpdateFromVigiflow.mockRejectedValueOnce(new Error('boom'));
      const dataRow = rowFromCols({ G: 'EC-003', W: '999' });
      const wb = sheetAt(1, [[], dataRow]);

      await service.extractedFromJsonReportToUpdate(wb);

      expect(mockNotifVigiflow.update).toHaveBeenCalledWith(notificacion, expect.anything(), null);
    });
  });

  // ---------------------------------------------------------------------------------------
  describe('extractedFromJsonReportToCreateMedicamento (hoja Medicamentos)', () => {
    it('omite la fila y no crea medicamento cuando el paciente no existe', async () => {
      const service = createService();
      mockPaciente.findAll.mockResolvedValueOnce([]);
      const row = rowFromCols({ A: 'EC-DESCONOCIDO', G: 'J07BX03' });
      const wb = sheetAt(2, [row]);

      await service.extractedFromJsonReportToCreateMedicamento(wb);

      expect(mockMedicamento.createOneToOne).not.toHaveBeenCalled();
      expect(mockDatoVacunacion.create).not.toHaveBeenCalled();
    });

    it('retiene la edad gestacional (col P) cuando está en el rango 1..43', async () => {
      const service: any = createService();
      const notificacion = { id: 'n-1', codigoOrigenNotificacion: 'EC-001' };
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-001' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map([['EC-001', [notificacion]]]));
      const row = rowFromCols({ A: 'EC-001', D: 'Paracetamol', G: 'A02BC01', P: '20' });
      const wb = sheetAt(2, [row]);

      await service.extractedFromJsonReportToCreateMedicamento(wb);

      // No se persiste aquí: las fechas derivadas requieren la fecha del ESAVI, que se
      // conoce al procesar la hoja Reacciones.
      expect(service.edadGestacionalPorNotificacion.get('n-1')).toBe(20);
      expect(mockEmbarazoEsavi.create).not.toHaveBeenCalled();
    });

    it('no registra la edad gestacional si está fuera del rango o no es numérica', async () => {
      const service = createService();
      const notificacion = { id: 'n-1', codigoOrigenNotificacion: 'EC-001' };
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-001' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map([['EC-001', [notificacion]]]));
      const wb = sheetAt(2, [
        rowFromCols({ A: 'EC-001', G: 'A02BC01', P: '44' }),
        rowFromCols({ A: 'EC-001', G: 'A02BC01', P: 'Desconocido' }),
        rowFromCols({ A: 'EC-001', G: 'A02BC01', P: '' }),
      ]);

      await service.extractedFromJsonReportToCreateMedicamento(wb);

      expect(mockEmbarazoEsavi.create).not.toHaveBeenCalled();
    });

    it('solo retiene la primera fila válida por notificación', async () => {
      const service: any = createService();
      const notificacion = { id: 'n-1', codigoOrigenNotificacion: 'EC-001' };
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-001' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map([['EC-001', [notificacion]]]));
      const wb = sheetAt(2, [
        rowFromCols({ A: 'EC-001', G: 'A02BC01', P: '12' }),
        rowFromCols({ A: 'EC-001', G: 'J07BX03', P: '30' }),
      ]);

      await service.extractedFromJsonReportToCreateMedicamento(wb);

      expect(service.edadGestacionalPorNotificacion.get('n-1')).toBe(12);
    });

    it('continúa procesando la fila si falla el registro de la edad gestacional', async () => {
      const service = createService();
      const notificacion = { id: 'n-1', codigoOrigenNotificacion: 'EC-001' };
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-001' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map([['EC-001', [notificacion]]]));
      mockEmbarazoEsavi.create.mockRejectedValueOnce(new Error('fallo antecedente'));
      const row = rowFromCols({ A: 'EC-001', G: 'A02BC01', P: '20' });
      const wb = sheetAt(2, [row]);

      await expect(service.extractedFromJsonReportToCreateMedicamento(wb)).resolves.toBeUndefined();

      expect(mockMedicamento.createOneToOne).toHaveBeenCalledTimes(1);
    });

    it('crea el medicamento pero no genera dato-vacuna si el ATC no es de vacuna', async () => {
      const service = createService();
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-001' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map([['EC-001', [{ id: 'n-1' }]]]));
      const row = rowFromCols({ A: 'EC-001', C: 'Concomitante', D: 'Paracetamol', G: 'A02BC01' });
      const wb = sheetAt(2, [row]);

      await service.extractedFromJsonReportToCreateMedicamento(wb);

      expect(mockMedicamento.createOneToOne).toHaveBeenCalledTimes(1);
      expect(mockDatoVacunacion.create).not.toHaveBeenCalled();
      expect(mockMedicamento.clearMedicamentosCache).toHaveBeenCalled();
      expect(mockDatoVacuna.clearDatoVacunaCache).toHaveBeenCalled();
    });

    it('camino feliz de vacuna J07 sin WHODrug global: crea datoVacunacion y datoVacuna nuevo', async () => {
      const service = createService(); // VIGIFLOW_USE_WHODRUG_GLOBAL por defecto false
      const notificacion = { id: 'n-1' };
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-001' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map([['EC-001', [notificacion]]]));
      mockDatoVacuna.findByNotifIdDtoMinimo.mockResolvedValueOnce([]);

      const row = rowFromCols({
        A: 'EC-001',
        C: 'Vacuna',
        D: 'VacunaX',
        E: 'Patente X\nsegunda linea',
        F: 'Ingrediente1;Ingrediente2',
        G: 'J07BX03',
        I: 'LabX',
        J: '',
        M: 'Ninguna',
        Q: 'Indicación',
        S: '1 dosis',
        T: 'Intervalo',
        U: 'Dosis1',
        V: 'Duración',
        W: '20230101',
        X: '20230102',
        Y: 'Forma',
        Z: 'FormaEDQM',
        AA: 'Oral',
        AB: 'ViaEDQM',
        AE: 'Lote123',
      });
      const wb = sheetAt(2, [row]);

      await service.extractedFromJsonReportToCreateMedicamento(wb);

      expect(mockMedicamento.createOneToOne).toHaveBeenCalledTimes(1);
      expect(mockDatoVacuna.findByNotifIdDtoMinimo).toHaveBeenCalledWith('n-1');
      expect(mockDatoVacunacion.create).toHaveBeenCalledWith(
        notificacion,
        expect.objectContaining({
          inicioAdministracion: new Date(Date.UTC(2023, 0, 1)),
          finAdministracion: new Date(Date.UTC(2023, 0, 2)),
        }),
      );
      expect(mockDatoVacuna.createByNotificacion).toHaveBeenCalledWith(
        notificacion,
        expect.objectContaining({
          paisAutorizacionIso3Code: 'ECU',
          numeroLote: 'Lote123',
          codigoAtc: 'J07BX03',
          rolVacuna: 'Vacuna',
          acIngredientTranslationJson: [{ ingredient: 'Ingrediente1' }, { ingredient: 'Ingrediente2' }],
        }),
      );
      expect(mockDatoVacuna.update).not.toHaveBeenCalled();
      expect(mockIngredientTranslation.findVaccineByIngredientAndMaholder).not.toHaveBeenCalled();
      expect(mockDrug.getDrugsOnly).not.toHaveBeenCalled();
    });

    it('actualiza el datoVacuna mínimo existente en lugar de crear uno nuevo', async () => {
      const service = createService();
      const notificacion = { id: 'n-2' };
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-002' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map([['EC-002', [notificacion]]]));
      mockDatoVacuna.findByNotifIdDtoMinimo.mockResolvedValueOnce([{ id: 'dv-existente' }]);

      const row = rowFromCols({ A: 'EC-002', C: 'Vacuna', G: 'J07AL02' });
      const wb = sheetAt(2, [row]);

      await service.extractedFromJsonReportToCreateMedicamento(wb);

      expect(mockDatoVacuna.update).toHaveBeenCalledWith('dv-existente', expect.anything());
      expect(mockDatoVacuna.invalidateMinimoEntry).toHaveBeenCalledWith('n-2', 'dv-existente');
      expect(mockDatoVacuna.createByNotificacion).not.toHaveBeenCalled();
    });

    it('con WHODrug global activo y match primario encontrado, no consulta el fallback y cachea por ingrediente+laboratorio', async () => {
      const service = createService({ VIGIFLOW_USE_WHODRUG_GLOBAL: 'true' });
      const notificacion = { id: 'n-3' };
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-003' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map([['EC-003', [notificacion]]]));
      mockIngredientTranslation.findVaccineByIngredientAndMaholder.mockResolvedValue({
        drugCode: 'D1',
        drugName: 'DrugName1',
        medicinalProductId: 'M1',
        maHolder: 'Holder1',
        maHolderMedicinalProductId: 'MH1',
      });

      // Dos filas con el mismo ingrediente+laboratorio: debe usarse la caché en la segunda.
      const row1 = rowFromCols({ A: 'EC-003', C: 'Vacuna', F: 'IngredienteA', G: 'J07AL02', I: 'LabA' });
      const row2 = rowFromCols({ A: 'EC-003', C: 'Vacuna', F: 'IngredienteA', G: 'J07AL03', I: 'LabA' });
      const wb = sheetAt(2, [row1, row2]);

      await service.extractedFromJsonReportToCreateMedicamento(wb);

      expect(mockIngredientTranslation.findVaccineByIngredientAndMaholder).toHaveBeenCalledTimes(1);
      expect(mockDrug.getDrugsOnly).not.toHaveBeenCalled();
      expect(mockDatoVacuna.createByNotificacion).toHaveBeenCalledWith(
        notificacion,
        expect.objectContaining({ drugCode: 'D1', drugName: 'DrugName1', maHolder: 'Holder1' }),
      );
    });

    it('con WHODrug global activo y sin match primario, recurre al fallback por nombre de patente', async () => {
      const service = createService({ VIGIFLOW_USE_WHODRUG_GLOBAL: 'true' });
      const notificacion = { id: 'n-4' };
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-004' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map([['EC-004', [notificacion]]]));
      mockIngredientTranslation.findVaccineByIngredientAndMaholder.mockResolvedValue(null);
      mockDrug.getDrugsOnly.mockResolvedValueOnce([{ id: 'drug-1', drugCode: 'DC1', drugName: 'DN1' }]);
      mockMaholder.getMaholderOfDrug.mockResolvedValueOnce([
        { name: 'HolderX', medicinalProductID: 'MPID1', countrySale: { medicinalProductID: 'CS1' } },
      ]);
      mockActiveIngredient.getActiveIngredentsOfDrug.mockResolvedValueOnce([{ id: 'ai-1', ingredient: 'IngX' }]);

      // F vacío: parseIngredientsWithSemicolonsToJson('') siempre retorna [] (nunca null/undefined),
      // por lo que acIngredientTranslationJson queda en [] (rama de traducción de respaldo no aplica).
      const row = rowFromCols({ A: 'EC-004', C: 'Vacuna', E: 'PatenteX', F: '', G: 'J07BX03', I: 'LabDesconocido' });
      const wb = sheetAt(2, [row]);

      await service.extractedFromJsonReportToCreateMedicamento(wb);

      expect(mockDrug.getDrugsOnly).toHaveBeenCalledWith('PatenteX', 'ECU');
      expect(mockMaholder.getMaholderOfDrug).toHaveBeenCalledWith('drug-1', 'ECU');
      expect(mockActiveIngredient.getActiveIngredentsOfDrug).toHaveBeenCalledWith('drug-1');
      expect(mockDatoVacuna.createByNotificacion).toHaveBeenCalledWith(
        notificacion,
        expect.objectContaining({
          drugCode: 'DC1',
          drugName: 'DN1',
          maHolder: 'HolderX',
          maHolderMedicinalProductId: 'MPID1',
          medicinalProductId: 'CS1',
          activeIngredientJson: [{ ingredient: 'IngX' }],
        }),
      );
    });

    it('omite la fila cuando el paciente existe en BD pero su caso fue descartado (sin notificación)', async () => {
      const service = createService();
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-006' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map());

      const row = rowFromCols({ A: 'EC-006', C: 'Vacuna', G: 'J07BX03' });
      const wb = sheetAt(2, [row]);

      await service.extractedFromJsonReportToCreateMedicamento(wb);

      expect(mockMedicamento.createOneToOne).not.toHaveBeenCalled();
      expect(mockDatoVacuna.createByNotificacion).not.toHaveBeenCalled();
    });

    it('limpia las cachés en el finally incluso si createOneToOne falla', async () => {
      const service = createService();
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-005' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map([['EC-005', [{ id: 'n-5' }]]]));
      mockMedicamento.createOneToOne.mockRejectedValueOnce(new Error('fallo medicamento'));
      const row = rowFromCols({ A: 'EC-005', G: 'J07BX03' });
      const wb = sheetAt(2, [row]);

      await expect(service.extractedFromJsonReportToCreateMedicamento(wb)).rejects.toThrow('fallo medicamento');

      expect(mockMedicamento.clearMedicamentosCache).toHaveBeenCalled();
      expect(mockDatoVacuna.clearDatoVacunaCache).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------------------
  describe('extractedFromJsonReportToCreateReaccion (hoja Reacciones)', () => {
    function buildBaseMocks() {
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-001' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(
        new Map([['EC-001', [{ id: 'n-1', codigoOrigenNotificacion: 'CASE-1' }]]]),
      );
    }

    it('camino feliz: crea un dato-esavi por cada evento reportado en la fila', async () => {
      const service = createService();
      buildBaseMocks();
      mockMeddraLlt.buscarPorSimilitud.mockResolvedValue({ code: 'LLT01', icd10Code: 'R50.9' });
      mockMeddraPt.searchPT.mockResolvedValue({ id: 'PT1', code: 'PTCODE1' });
      mockMeddraSoc.searchSOC.mockResolvedValue({ id: 'SOC1', code: 'SOCCODE1' });

      const row = rowFromCols({
        A: 'EC-001',
        C: 'Reportado1\nReportado2',
        D: 'fiebre\ncefalea',
        E: 'Pyrexia\nHeadache',
        I: '20230101\n20230102',
        J: '20230105\n20230106',
        K: '5 dias\n6 dias',
        N: 'Recuperado\nEn tratamiento',
      });
      const wb = sheetAt(3, [rowFromCols({}), row]);

      await service.extractedFromJsonReportToCreateReaccion(wb);

      expect(mockDatoEsavi.createVigiflow).toHaveBeenCalledTimes(2);
      const [notifArg1, dto1] = mockDatoEsavi.createVigiflow.mock.calls[0];
      expect(notifArg1.id).toBe('n-1');
      // NOMBRE_ESAVI_REPORTADO se toma del LLT MedDRA (col D), que viene en español,
      // y no del texto libre del notificador (col C), habitualmente en inglés.
      expect(dto1.nombreReportado).toBe('FIEBRE');
      expect(dto1.nombre).toBeUndefined();
      expect(dto1.namePT).toBe('PYREXIA');
      expect(dto1.fechaEsavi).toEqual(new Date(Date.UTC(2023, 0, 1)));
      expect(dto1.duracion).toBe('5 dias');
      expect(dto1.resultado).toBeUndefined();
      expect(dto1.codigoLLT).toBe('LLT01');
      expect(dto1.codigoEsaviCie10).toBe('R50.9');
      expect(dto1.CTPTMEDDRA_ID).toBe('PT1');
      expect(dto1.codigoPT).toBe('PTCODE1');
      expect(dto1.codigoCaso).toBe('CASE-1');

      // El estado final se consolida una sola vez por notificación, priorizando severidad:
      // 'Recuperado' (1) vs 'En tratamiento' (0 desconocido) → gana 1.
      expect(mockDesenlaceEsavi.create).toHaveBeenCalledTimes(1);
      expect(mockDesenlaceEsavi.create).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'n-1' }),
        expect.objectContaining({ resultadoEvento: 1 }),
      );
    });

    it('registra el evento con el texto del notificador (col C) cuando VigiFlow no lo codificó en MedDRA (col D vacía)', async () => {
      const service = createService();
      buildBaseMocks();

      const row = rowFromCols({
        A: 'EC-001',
        C: 'PRESENTA DEBUT DE CRISIS CONVULSIVAS, CIANOSIS PERIBUCAL, ATONIA.',
        D: '',
        I: '20260606',
        N: 'Recuperando/resolviendo',
      });
      const wb = sheetAt(3, [rowFromCols({}), row]);

      await service.extractedFromJsonReportToCreateReaccion(wb);

      expect(mockDatoEsavi.createVigiflow).toHaveBeenCalledTimes(1);
      const [, dto] = mockDatoEsavi.createVigiflow.mock.calls[0];
      expect(dto.nombreReportado).toBe('PRESENTA DEBUT DE CRISIS CONVULSIVAS, CIANOSIS PERIBUCAL, ATONIA.');
      // Sin LLT no hay codificación MedDRA: no se consulta el diccionario.
      expect(dto.nameLLT).toBeNull();
      expect(dto.codigoLLT).toBeNull();
      expect(dto.codigoEsaviCie10).toBeNull();
      expect(mockMeddraLlt.buscarPorSimilitud).not.toHaveBeenCalled();
      expect(dto.fechaEsavi).toEqual(new Date(Date.UTC(2026, 5, 6)));
    });

    it('omite la fila solo cuando no hay ni LLT (col D) ni texto reportado (col C)', async () => {
      const service = createService();
      buildBaseMocks();

      const row = rowFromCols({ A: 'EC-001', C: '', D: '', I: '20260606' });
      const wb = sheetAt(3, [rowFromCols({}), row]);

      await service.extractedFromJsonReportToCreateReaccion(wb);

      expect(mockDatoEsavi.createVigiflow).not.toHaveBeenCalled();
    });

    it('consolida las banderas de gravedad y RESULTADO_EVENTO desde "Criterio (s) de Gravedad"', async () => {
      const service = createService();
      buildBaseMocks();

      const row = rowFromCols({
        A: 'EC-001',
        D: 'fiebre\nshock',
        I: '20230101\n20230102',
        M: 'Hospitalización\nMuerte',
        N: 'Recuperado\nFatal',
      });
      const wb = sheetAt(3, [rowFromCols({}), row]);

      await service.extractedFromJsonReportToCreateReaccion(wb);

      // Criterio "Muerte" fuerza el código 5 por encima de cualquier otro resultado.
      expect(mockDesenlaceEsavi.create).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'n-1' }),
        expect.objectContaining({ resultadoEvento: 5 }),
      );
      const [, graveDto] = mockGravedadEsavi.create.mock.calls[0];
      expect(graveDto.muerte).toBe('1');
      expect(graveDto.hospitalizacion).toBe('1');
      expect(graveDto.discapacidad).toBe('0');
      expect(graveDto.anomaliaCongenita).toBe('0');
    });

    it('registra TR_ESAVI_DURANTE_EMBARAZO con las fechas derivadas de la fecha del ESAVI', async () => {
      const service: any = createService();
      buildBaseMocks();
      // La edad gestacional se captura en la hoja Medicamentos y se consume aquí.
      service.edadGestacionalPorNotificacion.set('n-1', 12);

      const row = rowFromCols({ A: 'EC-001', D: 'fiebre', I: '20241114' });
      const wb = sheetAt(3, [rowFromCols({}), row]);

      await service.extractedFromJsonReportToCreateReaccion(wb);

      const [, embarazoDto] = mockEmbarazoEsavi.create.mock.calls[0];
      expect(embarazoDto.edadGestacional).toBe(12);
      // FUM = 2024-11-14 − (12 × 7 días) = 2024-08-22
      expect(embarazoDto.fechaUltimaMenstruacion).toEqual(new Date(Date.UTC(2024, 7, 22)));
      // Parto = FUM + (40 × 7 días) = 2025-05-29
      expect(embarazoDto.fechaParto).toEqual(new Date(Date.UTC(2025, 4, 29)));
    });

    it('no registra embarazo si la notificación no tiene edad gestacional', async () => {
      const service = createService();
      buildBaseMocks();
      const row = rowFromCols({ A: 'EC-001', D: 'fiebre', I: '20241114' });
      const wb = sheetAt(3, [rowFromCols({}), row]);

      await service.extractedFromJsonReportToCreateReaccion(wb);

      expect(mockEmbarazoEsavi.create).not.toHaveBeenCalled();
    });

    it('omite la fila cuando el código de caso viene vacío', async () => {
      const service = createService();
      buildBaseMocks();
      const row = rowFromCols({ A: '', D: 'fiebre' });
      const wb = sheetAt(3, [rowFromCols({}), row]);

      await service.extractedFromJsonReportToCreateReaccion(wb);

      expect(mockDatoEsavi.createVigiflow).not.toHaveBeenCalled();
    });

    it('omite la fila cuando el paciente no existe', async () => {
      const service = createService();
      mockPaciente.findAll.mockResolvedValueOnce([]);
      const row = rowFromCols({ A: 'EC-DESCONOCIDO', D: 'fiebre' });
      const wb = sheetAt(3, [rowFromCols({}), row]);

      await service.extractedFromJsonReportToCreateReaccion(wb);

      expect(mockDatoEsavi.createVigiflow).not.toHaveBeenCalled();
    });

    it('omite la fila cuando el paciente no tiene notificación asociada', async () => {
      const service = createService();
      mockPaciente.findAll.mockResolvedValueOnce([{ id: 1, codigoOrigen: 'EC-002' }]);
      mockNotifVigiflow.findAllByCodigosOrigen.mockResolvedValueOnce(new Map());
      const row = rowFromCols({ A: 'EC-002', D: 'fiebre' });
      const wb = sheetAt(3, [rowFromCols({}), row]);

      await service.extractedFromJsonReportToCreateReaccion(wb);

      expect(mockDatoEsavi.createVigiflow).not.toHaveBeenCalled();
    });

    it('omite la fila cuando no hay eventos LLT', async () => {
      const service = createService();
      buildBaseMocks();
      const row = rowFromCols({ A: 'EC-001', D: '' });
      const wb = sheetAt(3, [rowFromCols({}), row]);

      await service.extractedFromJsonReportToCreateReaccion(wb);

      expect(mockDatoEsavi.createVigiflow).not.toHaveBeenCalled();
    });

    it('un error en un evento no detiene el procesamiento del resto', async () => {
      const service = createService();
      buildBaseMocks();
      mockMeddraLlt.buscarPorSimilitud
        .mockRejectedValueOnce(new Error('meddra caído'))
        .mockResolvedValueOnce({ code: 'LLT02', icd10Code: null });

      const row = rowFromCols({ A: 'EC-001', D: 'fiebre\ncefalea' });
      const wb = sheetAt(3, [rowFromCols({}), row]);

      await service.extractedFromJsonReportToCreateReaccion(wb);

      expect(mockDatoEsavi.createVigiflow).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------------------
  describe('handleCron', () => {
    it('procesa mes a mes hasta alcanzar la fecha actual y luego reinicia fechaInicio', async () => {
      jest.useFakeTimers({ advanceTimers: false });
      jest.setSystemTime(new Date('2024-12-15T00:00:00.000Z'));

      const service = createService({ VIGIFLOW_FECHA_INICIO_CRON: '2024-11-01' });
      const createInBulkSpy = jest.spyOn(service, 'createInBulk').mockResolvedValue(undefined);

      await (service as any).handleCron();

      expect(createInBulkSpy).toHaveBeenCalledTimes(2);
      expect(createInBulkSpy).toHaveBeenNthCalledWith(
        1,
        new Date(Date.UTC(2024, 10, 1)),
        new Date(Date.UTC(2024, 10, 30, 23, 59, 59, 999)),
      );
      expect(createInBulkSpy).toHaveBeenNthCalledWith(
        2,
        new Date(Date.UTC(2024, 11, 1)),
        new Date(Date.UTC(2024, 11, 31, 23, 59, 59, 999)),
      );
      expect((service as any).fechaInicio).toEqual((service as any).originalFechaInicio);
    });

    it('no procesa nada si la fecha de inicio configurada ya alcanzó la fecha actual', async () => {
      jest.useFakeTimers({ advanceTimers: false });
      jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const service = createService({ VIGIFLOW_FECHA_INICIO_CRON: '2025-01-01' });
      const createInBulkSpy = jest.spyOn(service, 'createInBulk').mockResolvedValue(undefined);

      await (service as any).handleCron();

      expect(createInBulkSpy).not.toHaveBeenCalled();
      expect((service as any).fechaInicio).toEqual((service as any).originalFechaInicio);
    });
  });
});
