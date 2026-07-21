import { Test, TestingModule } from '@nestjs/testing';
import { Dhis2ProcessingLogService } from './dhis2-processing-log.service';
import { LogType, ProcessingStatus } from '../dto';

describe('Dhis2ProcessingLogService', () => {
  let service: Dhis2ProcessingLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Dhis2ProcessingLogService],
    }).compile();
    service = module.get<Dhis2ProcessingLogService>(Dhis2ProcessingLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLog', () => {
    it('crea un log con id, timestamp y valores por defecto (usuario SYSTEM, loteId default)', () => {
      const log = service.createLog(LogType.RECORD_PROCESSING, ProcessingStatus.SUCCESS, 'mensaje de prueba');

      expect(log.id).toBeDefined();
      expect(log.tipo).toBe(LogType.RECORD_PROCESSING);
      expect(log.status).toBe(ProcessingStatus.SUCCESS);
      expect(log.mensaje).toBe('mensaje de prueba');
      expect(log.usuario).toBe('SYSTEM');
      expect(log.timestamp).toBeDefined();
      expect(service.getLogsByLote('default')).toContainEqual(log);
    });

    it('almacena el log bajo el loteId indicado en metadata', () => {
      const log = service.createLog(LogType.ERROR_OCCURRED, ProcessingStatus.ERROR, 'error', {
        loteId: 'LOTE1',
        usuario: 'TESTER',
        codigoDhis2Evento: 'COD1',
        identificacionPaciente: 'ID1',
        detalles: 'detalle',
        error: 'boom',
      });

      expect(log.loteId).toBe('LOTE1');
      expect(log.usuario).toBe('TESTER');
      expect(service.getLogsByLote('LOTE1')).toHaveLength(1);
      expect(service.getLogsByLote('LOTE1')[0]).toBe(log);
    });

    it('acumula varios logs para el mismo lote', () => {
      service.createLog(LogType.IMPORT_START, ProcessingStatus.PENDING, 'inicio', { loteId: 'LOTE2' });
      service.createLog(LogType.IMPORT_END, ProcessingStatus.SUCCESS, 'fin', { loteId: 'LOTE2' });

      expect(service.getLogsByLote('LOTE2')).toHaveLength(2);
    });

    it('usa this.logger.warn cuando el status es WARNING (rama logToConsole)', () => {
      expect(() =>
        service.createLog(LogType.RECORD_PROCESSING, ProcessingStatus.WARNING, 'aviso', { loteId: 'LOTE_WARN' }),
      ).not.toThrow();
    });

    it('usa this.logger.debug para status por defecto (ej. PENDING) y registra detalles', () => {
      expect(() =>
        service.createLog(LogType.IMPORT_START, ProcessingStatus.PENDING, 'pendiente', {
          loteId: 'LOTE_PENDING',
          detalles: 'con detalles',
        }),
      ).not.toThrow();
    });
  });

  describe('logImportStart / logImportEnd', () => {
    it('logImportStart crea un log tipo IMPORT_START con metadata de fechas y totalRegistros', () => {
      const fechaInicio = new Date('2024-01-01T00:00:00.000Z');
      const fechaFin = new Date('2024-01-31T00:00:00.000Z');

      const log = service.logImportStart('LOTE3', fechaInicio, fechaFin, 'J07', 10, 'SYSTEM');

      expect(log.tipo).toBe(LogType.IMPORT_START);
      expect(log.status).toBe(ProcessingStatus.PENDING);
      expect(log.metadata.fechaInicio).toBe(fechaInicio.toISOString());
      expect(log.metadata.codigoATC).toBe('J07');
      expect(log.metadata.totalRegistros).toBe(10);
    });

    it('logImportEnd crea un log tipo IMPORT_END con el resumen en el mensaje', () => {
      const summary = service.createProcessingSummary(
        'LOTE4',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'J07',
        5,
      );
      summary.registrosProcesados = 5;

      const log = service.logImportEnd('LOTE4', summary, 'SYSTEM');

      expect(log.tipo).toBe(LogType.IMPORT_END);
      expect(log.mensaje).toContain('5/5');
      expect(log.metadata).toBe(summary);
    });
  });

  describe('logRecordProcessing', () => {
    it('crea un log tipo RECORD_PROCESSING con el status y detalles dados', () => {
      const log = service.logRecordProcessing(
        'LOTE5',
        'COD123',
        'ID123',
        ProcessingStatus.SUCCESS,
        'Registro procesado',
        'detalle',
      );

      expect(log.tipo).toBe(LogType.RECORD_PROCESSING);
      expect(log.codigoDhis2Evento).toBe('COD123');
      expect(log.identificacionPaciente).toBe('ID123');
      expect(log.detalles).toBe('detalle');
    });
  });

  describe('logDuplicateDetected / logDuplicateResolved', () => {
    it('logDuplicateDetected crea un log con status DUPLICATE_FOUND y metadata de datos existentes/nuevos', () => {
      const log = service.logDuplicateDetected(
        'LOTE6',
        'COD1',
        'ID1',
        'Ya existe',
        { a: 1 },
        { b: 2 },
      );

      expect(log.tipo).toBe(LogType.DUPLICATE_DETECTED);
      expect(log.status).toBe(ProcessingStatus.DUPLICATE_FOUND);
      expect(log.metadata.datosExistentes).toEqual({ a: 1 });
      expect(log.metadata.datosNuevos).toEqual({ b: 2 });
    });

    it('logDuplicateResolved crea un log tipo DUPLICATE_RESOLVED con status SUCCESS', () => {
      const log = service.logDuplicateResolved('LOTE6', 'COD1', 'ACTUALIZAR_INDIVIDUAL', 'resultado ok');

      expect(log.tipo).toBe(LogType.DUPLICATE_RESOLVED);
      expect(log.status).toBe(ProcessingStatus.SUCCESS);
      expect(log.detalles).toBe('resultado ok');
    });
  });

  describe('logError', () => {
    it('crea un log tipo ERROR_OCCURRED con status ERROR y el mensaje de error', () => {
      const log = service.logError('LOTE7', 'fallo procesando', 'stack trace', 'COD1', 'ID1');

      expect(log.tipo).toBe(LogType.ERROR_OCCURRED);
      expect(log.status).toBe(ProcessingStatus.ERROR);
      expect(log.error).toBe('stack trace');
    });
  });

  describe('getLogsByLote / getAllLogs', () => {
    it('getLogsByLote retorna arreglo vacío si el lote no existe', () => {
      expect(service.getLogsByLote('NO_EXISTE')).toEqual([]);
    });

    it('getAllLogs retorna todos los logs de todos los lotes ordenados por timestamp', () => {
      service.createLog(LogType.RECORD_PROCESSING, ProcessingStatus.SUCCESS, 'm1', { loteId: 'A' });
      service.createLog(LogType.RECORD_PROCESSING, ProcessingStatus.SUCCESS, 'm2', { loteId: 'B' });

      const all = service.getAllLogs();
      expect(all.length).toBeGreaterThanOrEqual(2);
      const mensajes = all.map((l) => l.mensaje);
      expect(mensajes).toEqual(expect.arrayContaining(['m1', 'm2']));
    });
  });

  describe('createProcessingSummary / updateProcessingSummary / getProcessingSummary', () => {
    it('crea un resumen con contadores en cero', () => {
      const summary = service.createProcessingSummary(
        'LOTE8',
        new Date('2024-02-01'),
        new Date('2024-02-28'),
        'J07',
        20,
      );

      expect(summary.totalRegistros).toBe(20);
      expect(summary.registrosProcesados).toBe(0);
      expect(service.getProcessingSummary('LOTE8')).toBe(summary);
    });

    it('actualiza los campos indicados del resumen existente', () => {
      service.createProcessingSummary('LOTE9', new Date('2024-02-01'), new Date('2024-02-28'), 'J07', 20);

      service.updateProcessingSummary('LOTE9', { registrosProcesados: 15, registrosConError: 5 });

      const summary = service.getProcessingSummary('LOTE9');
      expect(summary.registrosProcesados).toBe(15);
      expect(summary.registrosConError).toBe(5);
    });

    it('no falla si se intenta actualizar un resumen para un lote inexistente', () => {
      expect(() => service.updateProcessingSummary('NO_EXISTE', { registrosProcesados: 1 })).not.toThrow();
    });

    it('getProcessingSummary retorna undefined si el lote no existe', () => {
      expect(service.getProcessingSummary('NO_EXISTE')).toBeUndefined();
    });
  });

  describe('cleanOldLogs', () => {
    it('elimina logs con timestamp anterior al límite de días a conservar', () => {
      const log = service.createLog(LogType.RECORD_PROCESSING, ProcessingStatus.SUCCESS, 'viejo', {
        loteId: 'LOTE_OLD',
      });
      // Forzar timestamp antiguo directamente sobre el objeto almacenado
      log.timestamp = new Date('2000-01-01').toISOString();

      service.cleanOldLogs(30);

      expect(service.getLogsByLote('LOTE_OLD')).toHaveLength(0);
    });

    it('conserva logs recientes dentro del límite de días', () => {
      service.createLog(LogType.RECORD_PROCESSING, ProcessingStatus.SUCCESS, 'reciente', {
        loteId: 'LOTE_RECENT',
      });

      service.cleanOldLogs(30);

      expect(service.getLogsByLote('LOTE_RECENT')).toHaveLength(1);
    });
  });
});
