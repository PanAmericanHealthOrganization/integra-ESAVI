import { Test, TestingModule } from '@nestjs/testing';
import { Dhis2IntegradorController } from './dhis2-integrador.controller';
import { Dhis2IntegratorService } from '../services/dhis2-integrator.service';
import { Dhis2ProcessingLogService } from '../services/dhis2-processing-log.service';
import { Dhis2DuplicateHandlerService } from '../services/dhis2-duplicate-handler.service';
import { AefiQuery } from '../../vigiflow-integrator/dto';
import { DuplicateAction } from '../dto';

const mockDhis2IntegratorService = {
  createInBulk: jest.fn(),
};

const mockProcessingLogService = {
  getLogsByLote: jest.fn(),
  getAllLogs: jest.fn(),
  getProcessingSummary: jest.fn(),
};

const mockDuplicateHandlerService = {
  getPendingDuplicates: jest.fn(),
  getPendingDuplicate: jest.fn(),
  processConfirmation: jest.fn(),
};

describe('Dhis2IntegradorController', () => {
  let controller: Dhis2IntegradorController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Dhis2IntegradorController],
      providers: [
        { provide: Dhis2IntegratorService, useValue: mockDhis2IntegratorService },
        { provide: Dhis2ProcessingLogService, useValue: mockProcessingLogService },
        { provide: Dhis2DuplicateHandlerService, useValue: mockDuplicateHandlerService },
      ],
    }).compile();
    controller = module.get<Dhis2IntegradorController>(Dhis2IntegradorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('console (GET /bulk)', () => {
    const aefiQuery: AefiQuery = {
      fechaInicio: '20240101',
      fechaFin: '20240131',
      codigoATC: 'J07',
    };

    it('convierte las fechas YYYYMMDD y delega en dhis2IntegratorService.createInBulk', async () => {
      mockDhis2IntegratorService.createInBulk.mockResolvedValue(undefined);

      const result = await controller.console(aefiQuery);

      expect(mockDhis2IntegratorService.createInBulk).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'J07',
      );
      expect(result).toEqual({ status: 'OK', msg: 'Éxito' });
    });

    it('retorna status ERROR si createInBulk lanza una excepción', async () => {
      mockDhis2IntegratorService.createInBulk.mockRejectedValue(new Error('fallo dhis2'));

      const result = await controller.console(aefiQuery);

      expect(result).toEqual({
        status: 'ERROR',
        msg: 'Error al importar datos del sistema DHIS2',
      });
    });
  });

  describe('createInBulkWithDuplicateHandling (POST /bulk-with-duplicate-handling)', () => {
    const aefiQuery: AefiQuery = {
      fechaInicio: '20240201',
      fechaFin: '20240228',
      codigoATC: 'J07',
    };

    it('delega en createInBulk pasando la configuración de duplicados recibida en el body', async () => {
      mockDhis2IntegratorService.createInBulk.mockResolvedValue(undefined);
      const duplicateConfig = { accionPorDefecto: DuplicateAction.SKIP };

      const result = await controller.createInBulkWithDuplicateHandling(aefiQuery, duplicateConfig);

      expect(mockDhis2IntegratorService.createInBulk).toHaveBeenCalledWith(
        new Date('2024-02-01'),
        new Date('2024-02-28'),
        'J07',
        duplicateConfig,
      );
      expect(result).toEqual({ status: 'OK', msg: 'Éxito' });
    });

    it('retorna status ERROR si createInBulk lanza una excepción', async () => {
      mockDhis2IntegratorService.createInBulk.mockRejectedValue(new Error('fallo dhis2'));

      const result = await controller.createInBulkWithDuplicateHandling(aefiQuery, undefined);

      expect(result).toEqual({
        status: 'ERROR',
        msg: 'Error al importar datos del sistema DHIS2',
      });
    });
  });

  describe('getPendingDuplicates (GET /duplicates/pending)', () => {
    it('retorna la lista de duplicados pendientes del servicio', async () => {
      const pendientes = [{ codigoDhis2Evento: 'COD1' }];
      mockDuplicateHandlerService.getPendingDuplicates.mockReturnValue(pendientes);

      const result = await controller.getPendingDuplicates();

      expect(result).toBe(pendientes);
    });
  });

  describe('getPendingDuplicate (GET /duplicates/pending/:codigoDhis2Evento)', () => {
    it('retorna el duplicado pendiente específico por código', async () => {
      const pendiente = { codigoDhis2Evento: 'COD1' };
      mockDuplicateHandlerService.getPendingDuplicate.mockReturnValue(pendiente);

      const result = await controller.getPendingDuplicate('COD1');

      expect(mockDuplicateHandlerService.getPendingDuplicate).toHaveBeenCalledWith('COD1');
      expect(result).toBe(pendiente);
    });
  });

  describe('confirmDuplicateAction (POST /duplicates/confirm)', () => {
    it('procesa la confirmación con newRecord null y loteId fijo MANUAL_CONFIRMATION', async () => {
      const confirmation = { codigoDhis2Evento: 'COD1', accion: DuplicateAction.UPDATE_INDIVIDUAL };
      const resultadoServicio = { codigoDhis2Evento: 'COD1', accionTomada: DuplicateAction.UPDATE_INDIVIDUAL, procesado: true };
      mockDuplicateHandlerService.processConfirmation.mockResolvedValue(resultadoServicio);

      const result = await controller.confirmDuplicateAction(confirmation);

      expect(mockDuplicateHandlerService.processConfirmation).toHaveBeenCalledWith(
        confirmation,
        null,
        'MANUAL_CONFIRMATION',
      );
      expect(result).toEqual({ status: 'OK', result: resultadoServicio });
    });

    it('retorna status ERROR con el mensaje de la excepción si processConfirmation falla', async () => {
      const confirmation = { codigoDhis2Evento: 'COD1', accion: DuplicateAction.SKIP };
      mockDuplicateHandlerService.processConfirmation.mockRejectedValue(new Error('fallo confirmacion'));

      const result = await controller.confirmDuplicateAction(confirmation);

      expect(result).toEqual({
        status: 'ERROR',
        msg: 'Error procesando confirmación de duplicado',
        error: 'fallo confirmacion',
      });
    });
  });

  describe('getProcessingLogs (GET /logs/:loteId)', () => {
    it('retorna los logs del lote solicitado', async () => {
      const logs = [{ id: 'log1' }];
      mockProcessingLogService.getLogsByLote.mockReturnValue(logs);

      const result = await controller.getProcessingLogs('LOTE1');

      expect(mockProcessingLogService.getLogsByLote).toHaveBeenCalledWith('LOTE1');
      expect(result).toBe(logs);
    });
  });

  describe('getAllProcessingLogs (GET /logs)', () => {
    it('retorna todos los logs de procesamiento', async () => {
      const logs = [{ id: 'log1' }, { id: 'log2' }];
      mockProcessingLogService.getAllLogs.mockReturnValue(logs);

      const result = await controller.getAllProcessingLogs();

      expect(result).toBe(logs);
    });
  });

  describe('getProcessingSummary (GET /summary/:loteId)', () => {
    it('retorna el resumen de procesamiento del lote solicitado', async () => {
      const summary = { loteId: 'LOTE1', totalRegistros: 5 };
      mockProcessingLogService.getProcessingSummary.mockReturnValue(summary);

      const result = await controller.getProcessingSummary('LOTE1');

      expect(mockProcessingLogService.getProcessingSummary).toHaveBeenCalledWith('LOTE1');
      expect(result).toBe(summary);
    });
  });
});
