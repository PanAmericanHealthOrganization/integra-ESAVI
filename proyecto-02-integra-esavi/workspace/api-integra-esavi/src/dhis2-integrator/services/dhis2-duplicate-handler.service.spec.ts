import { Test, TestingModule } from '@nestjs/testing';
import { Dhis2DuplicateHandlerService } from './dhis2-duplicate-handler.service';
import { Dhis2ProcessingLogService } from './dhis2-processing-log.service';
import { IntegradorService } from '../../integrator/facade/integrador.service';
import { DuplicateAction, DuplicateRecordDto } from '../dto';
import { CreateCompleteDto } from '../../integrator/dto';

const mockProcessingLogService = {
  logError: jest.fn(),
  logDuplicateDetected: jest.fn(),
  logDuplicateResolved: jest.fn(),
};

const mockIntegradorService = {
  findByCodigoDhis2Evento: jest.fn(),
  findByIdentificacionAndDateRange: jest.fn(),
  updateByCodigoDhis2Evento: jest.fn(),
  findSimilarRecords: jest.fn(),
};

const buildDuplicateRecord = (overrides: Partial<DuplicateRecordDto> = {}): DuplicateRecordDto => ({
  codigoDhis2Evento: 'COD1',
  identificacionPaciente: 'ID1',
  fechaNotificacion: new Date('2024-01-01').toISOString(),
  motivoDuplicado: 'motivo',
  datosExistentes: '{}',
  datosNuevos: '{}',
  ...overrides,
});

describe('Dhis2DuplicateHandlerService', () => {
  let service: Dhis2DuplicateHandlerService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Dhis2DuplicateHandlerService,
        { provide: Dhis2ProcessingLogService, useValue: mockProcessingLogService },
        { provide: IntegradorService, useValue: mockIntegradorService },
      ],
    }).compile();
    service = module.get<Dhis2DuplicateHandlerService>(Dhis2DuplicateHandlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectDuplicate', () => {
    it('retorna isDuplicate=true si ya existe un registro con el mismo código DHIS2', async () => {
      mockIntegradorService.findByCodigoDhis2Evento.mockResolvedValue({ id: 'EXIST1' });

      const result = await service.detectDuplicate('COD1', 'ID1', 'LOTE1');

      expect(result.isDuplicate).toBe(true);
      expect(result.existingRecord).toEqual({ id: 'EXIST1' });
      expect(result.reason).toContain('COD1');
      expect(mockIntegradorService.findByIdentificacionAndDateRange).not.toHaveBeenCalled();
    });

    it('retorna isDuplicate=true si hay un registro similar por identificación y fecha, cuando no hay match por código', async () => {
      mockIntegradorService.findByCodigoDhis2Evento.mockResolvedValue(null);
      mockIntegradorService.findByIdentificacionAndDateRange.mockResolvedValue([{ id: 'SIMILAR1' }]);

      const result = await service.detectDuplicate('COD2', 'ID2', 'LOTE1');

      expect(result.isDuplicate).toBe(true);
      expect(result.existingRecord).toEqual({ id: 'SIMILAR1' });
      expect(result.reason).toContain('ID2');
    });

    it('retorna isDuplicate=false si no hay coincidencias por código ni por identificación', async () => {
      mockIntegradorService.findByCodigoDhis2Evento.mockResolvedValue(null);
      mockIntegradorService.findByIdentificacionAndDateRange.mockResolvedValue([]);

      const result = await service.detectDuplicate('COD3', 'ID3', 'LOTE1');

      expect(result).toEqual({ isDuplicate: false });
    });

    it('captura errores del servicio, registra el error en el log y retorna isDuplicate=false', async () => {
      mockIntegradorService.findByCodigoDhis2Evento.mockRejectedValue(new Error('DB caída'));

      const result = await service.detectDuplicate('COD4', 'ID4', 'LOTE1');

      expect(result).toEqual({ isDuplicate: false });
      expect(mockProcessingLogService.logError).toHaveBeenCalledWith(
        'LOTE1',
        expect.stringContaining('COD4'),
        'DB caída',
        'COD4',
        'ID4',
      );
    });
  });

  describe('handleDuplicate', () => {
    const newRecord = { source: 'DHIS2' } as unknown as CreateCompleteDto;

    it('ejecuta skipDuplicate cuando la acción por defecto es SKIP', async () => {
      const duplicateRecord = buildDuplicateRecord();

      const result = await service.handleDuplicate(duplicateRecord, newRecord, 'LOTE1', {
        accionPorDefecto: DuplicateAction.SKIP,
      });

      expect(result.accionTomada).toBe(DuplicateAction.SKIP);
      expect(result.procesado).toBe(true);
      expect(mockProcessingLogService.logDuplicateResolved).toHaveBeenCalledWith(
        'LOTE1',
        'COD1',
        'OMITIR',
        expect.any(String),
      );
    });

    it('ejecuta updateIndividualDuplicate cuando la acción es UPDATE_INDIVIDUAL y actualiza el registro existente', async () => {
      const duplicateRecord = buildDuplicateRecord();
      mockIntegradorService.updateByCodigoDhis2Evento.mockResolvedValue(undefined);

      const result = await service.handleDuplicate(duplicateRecord, newRecord, 'LOTE1', {
        accionPorDefecto: DuplicateAction.UPDATE_INDIVIDUAL,
      });

      expect(mockIntegradorService.updateByCodigoDhis2Evento).toHaveBeenCalledWith('COD1', newRecord);
      expect(result.accionTomada).toBe(DuplicateAction.UPDATE_INDIVIDUAL);
      expect(result.procesado).toBe(true);
    });

    it('updateIndividualDuplicate retorna procesado=false si integradorService.updateByCodigoDhis2Evento falla', async () => {
      const duplicateRecord = buildDuplicateRecord();
      mockIntegradorService.updateByCodigoDhis2Evento.mockRejectedValue(new Error('update falló'));

      const result = await service.handleDuplicate(duplicateRecord, newRecord, 'LOTE1', {
        accionPorDefecto: DuplicateAction.UPDATE_INDIVIDUAL,
      });

      expect(result.procesado).toBe(false);
      expect(result.error).toBe('update falló');
    });

    it('ejecuta updateAllDuplicates cuando la acción es UPDATE_ALL y actualiza todos los registros similares', async () => {
      const duplicateRecord = buildDuplicateRecord();
      mockIntegradorService.findSimilarRecords.mockResolvedValue([
        { codigoOrigenNotificacion: 'COD_A' },
        { codigoOrigenNotificacion: 'COD_B' },
      ]);
      mockIntegradorService.updateByCodigoDhis2Evento.mockResolvedValue(undefined);

      const result = await service.handleDuplicate(duplicateRecord, newRecord, 'LOTE1', {
        accionPorDefecto: DuplicateAction.UPDATE_ALL,
      });

      expect(mockIntegradorService.updateByCodigoDhis2Evento).toHaveBeenCalledTimes(2);
      expect(result.accionTomada).toBe(DuplicateAction.UPDATE_ALL);
      expect(result.mensaje).toContain('2 registros');
      expect(result.procesado).toBe(true);
    });

    it('updateAllDuplicates retorna procesado=false si falla la búsqueda de registros similares', async () => {
      const duplicateRecord = buildDuplicateRecord();
      mockIntegradorService.findSimilarRecords.mockRejectedValue(new Error('busqueda falló'));

      const result = await service.handleDuplicate(duplicateRecord, newRecord, 'LOTE1', {
        accionPorDefecto: DuplicateAction.UPDATE_ALL,
      });

      expect(result.procesado).toBe(false);
      expect(result.error).toBe('busqueda falló');
    });

    it('ejecuta askConfirmation cuando la acción es ASK_CONFIRMATION y deja el duplicado pendiente', async () => {
      const duplicateRecord = buildDuplicateRecord();

      const result = await service.handleDuplicate(duplicateRecord, newRecord, 'LOTE1', {
        accionPorDefecto: DuplicateAction.ASK_CONFIRMATION,
      });

      expect(result.accionTomada).toBe(DuplicateAction.ASK_CONFIRMATION);
      expect(result.procesado).toBe(false);
      expect(service.getPendingDuplicate('COD1')).toEqual(duplicateRecord);
      expect(service.getPendingDuplicates()).toContainEqual(duplicateRecord);
    });

    it('usa la acción configurada específicamente para el código sobre la config general', async () => {
      const duplicateRecord = buildDuplicateRecord();
      service.setActionForRecord('COD1', DuplicateAction.SKIP);

      const result = await service.handleDuplicate(duplicateRecord, newRecord, 'LOTE1', {
        accionPorDefecto: DuplicateAction.UPDATE_INDIVIDUAL,
      });

      expect(result.accionTomada).toBe(DuplicateAction.SKIP);
    });

    it('usa skipDuplicate por defecto si la acción no coincide con ningún caso conocido', async () => {
      const duplicateRecord = buildDuplicateRecord();

      const result = await service.handleDuplicate(duplicateRecord, newRecord, 'LOTE1', {
        accionPorDefecto: 'ACCION_DESCONOCIDA' as DuplicateAction,
      });

      expect(result.accionTomada).toBe(DuplicateAction.SKIP);
    });

    it('usa this.globalConfiguration cuando no se pasa config', async () => {
      const duplicateRecord = buildDuplicateRecord();
      mockIntegradorService.updateByCodigoDhis2Evento.mockResolvedValue(undefined);

      const result = await service.handleDuplicate(duplicateRecord, newRecord, 'LOTE1');

      // globalConfiguration por defecto usa UPDATE_INDIVIDUAL
      expect(result.accionTomada).toBe(DuplicateAction.UPDATE_INDIVIDUAL);
    });
  });

  describe('processConfirmation', () => {
    const newRecord = { source: 'DHIS2' } as unknown as CreateCompleteDto;

    it('retorna error si no hay duplicado pendiente para el código dado', async () => {
      const result = await service.processConfirmation(
        { codigoDhis2Evento: 'NOEXISTE', accion: DuplicateAction.SKIP },
        newRecord,
        'LOTE1',
      );

      expect(result.procesado).toBe(false);
      expect(result.error).toBe('Registro duplicado no encontrado en pendientes');
    });

    it('procesa la confirmación con el registro provisto y remueve el pendiente', async () => {
      const duplicateRecord = buildDuplicateRecord();
      await service.handleDuplicate(duplicateRecord, newRecord, 'LOTE1', {
        accionPorDefecto: DuplicateAction.ASK_CONFIRMATION,
      });

      const result = await service.processConfirmation(
        { codigoDhis2Evento: 'COD1', accion: DuplicateAction.SKIP },
        newRecord,
        'MANUAL_CONFIRMATION',
      );

      expect(result.accionTomada).toBe(DuplicateAction.SKIP);
      expect(service.getPendingDuplicate('COD1')).toBeUndefined();
    });

    it('recupera el CreateCompleteDto guardado internamente cuando newRecord es null', async () => {
      const duplicateRecord = buildDuplicateRecord({ codigoDhis2Evento: 'COD_REC' });
      await service.handleDuplicate(duplicateRecord, newRecord, 'LOTE1', {
        accionPorDefecto: DuplicateAction.ASK_CONFIRMATION,
      });

      mockIntegradorService.updateByCodigoDhis2Evento.mockResolvedValue(undefined);
      const result = await service.processConfirmation(
        { codigoDhis2Evento: 'COD_REC', accion: DuplicateAction.UPDATE_INDIVIDUAL },
        null,
        'MANUAL_CONFIRMATION',
      );

      expect(mockIntegradorService.updateByCodigoDhis2Evento).toHaveBeenCalledWith('COD_REC', newRecord);
      expect(result.procesado).toBe(true);
    });

    it('guarda la acción como config global cuando aplicarATodos=true', async () => {
      const duplicateRecord = buildDuplicateRecord({ codigoDhis2Evento: 'COD_ALL' });
      await service.handleDuplicate(duplicateRecord, newRecord, 'LOTE1', {
        accionPorDefecto: DuplicateAction.ASK_CONFIRMATION,
      });

      await service.processConfirmation(
        { codigoDhis2Evento: 'COD_ALL', accion: DuplicateAction.SKIP, aplicarATodos: true },
        newRecord,
        'MANUAL_CONFIRMATION',
      );

      // Una nueva ocurrencia del mismo código ahora debe usar SKIP por la config guardada
      const duplicateRecord2 = buildDuplicateRecord({ codigoDhis2Evento: 'COD_ALL' });
      const result2 = await service.handleDuplicate(duplicateRecord2, newRecord, 'LOTE1', {
        accionPorDefecto: DuplicateAction.UPDATE_INDIVIDUAL,
      });
      expect(result2.accionTomada).toBe(DuplicateAction.SKIP);
    });
  });

  describe('getPendingDuplicates / getPendingDuplicate', () => {
    it('getPendingDuplicates retorna arreglo vacío si no hay pendientes', () => {
      expect(service.getPendingDuplicates()).toEqual([]);
    });

    it('getPendingDuplicate retorna undefined si el código no está pendiente', () => {
      expect(service.getPendingDuplicate('NOEXISTE')).toBeUndefined();
    });
  });

  describe('setDefaultAction / setActionForRecord', () => {
    it('setDefaultAction cambia la acción por defecto usada por handleDuplicate sin config explícita', async () => {
      service.setDefaultAction(DuplicateAction.SKIP);
      const duplicateRecord = buildDuplicateRecord({ codigoDhis2Evento: 'COD_DEFAULT' });

      const result = await service.handleDuplicate(duplicateRecord, {} as CreateCompleteDto, 'LOTE1');

      expect(result.accionTomada).toBe(DuplicateAction.SKIP);
    });
  });

  describe('cleanOldPendingDuplicates', () => {
    it('elimina duplicados pendientes cuya fechaNotificacion supera la antigüedad máxima', async () => {
      const duplicateRecord = buildDuplicateRecord({
        codigoDhis2Evento: 'COD_OLD',
        fechaNotificacion: new Date('2000-01-01').toISOString(),
      });
      await service.handleDuplicate(duplicateRecord, {} as CreateCompleteDto, 'LOTE1', {
        accionPorDefecto: DuplicateAction.ASK_CONFIRMATION,
      });

      service.cleanOldPendingDuplicates(24);

      expect(service.getPendingDuplicate('COD_OLD')).toBeUndefined();
    });

    it('conserva duplicados pendientes recientes', async () => {
      const duplicateRecord = buildDuplicateRecord({
        codigoDhis2Evento: 'COD_RECENT',
        fechaNotificacion: new Date().toISOString(),
      });
      await service.handleDuplicate(duplicateRecord, {} as CreateCompleteDto, 'LOTE1', {
        accionPorDefecto: DuplicateAction.ASK_CONFIRMATION,
      });

      service.cleanOldPendingDuplicates(24);

      expect(service.getPendingDuplicate('COD_RECENT')).toEqual(duplicateRecord);
    });
  });
});
