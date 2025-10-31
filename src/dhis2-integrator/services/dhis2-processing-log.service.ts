import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  Dhis2ProcessingLogDto,
  LogType,
  ProcessingStatus,
  ProcessingSummaryDto,
} from '../dto/dhis2-processing-log.dto';

@Injectable()
export class Dhis2ProcessingLogService {
  private readonly logger = new Logger(Dhis2ProcessingLogService.name);
  private readonly processingLogs: Map<string, Dhis2ProcessingLogDto[]> = new Map();
  private readonly processingSummaries: Map<string, ProcessingSummaryDto> = new Map();

  /**
   * Crea un nuevo log de procesamiento
   */
  createLog(
    tipo: LogType,
    status: ProcessingStatus,
    mensaje: string,
    metadata?: {
      codigoDhis2Evento?: string;
      identificacionPaciente?: string;
      detalles?: string;
      metadata?: Record<string, any>;
      usuario?: string;
      loteId?: string;
      error?: string;
    },
  ): Dhis2ProcessingLogDto {
    const log: Dhis2ProcessingLogDto = {
      id: uuidv4(),
      tipo,
      status,
      codigoDhis2Evento: metadata?.codigoDhis2Evento,
      identificacionPaciente: metadata?.identificacionPaciente,
      mensaje,
      detalles: metadata?.detalles,
      metadata: metadata?.metadata,
      timestamp: new Date().toISOString(),
      usuario: metadata?.usuario || 'SYSTEM',
      loteId: metadata?.loteId,
      error: metadata?.error,
    };

    // Almacenar en memoria (en producción esto debería ir a una base de datos)
    const loteId = metadata?.loteId || 'default';
    if (!this.processingLogs.has(loteId)) {
      this.processingLogs.set(loteId, []);
    }
    this.processingLogs.get(loteId)!.push(log);

    // Log también en consola para debugging
    this.logToConsole(log);

    return log;
  }

  /**
   * Log de inicio de importación
   */
  logImportStart(
    loteId: string,
    fechaInicio: Date,
    fechaFin: Date,
    codigoATC: string,
    totalRegistros: number,
    usuario?: string,
  ): Dhis2ProcessingLogDto {
    return this.createLog(
      LogType.IMPORT_START,
      ProcessingStatus.PENDING,
      `Iniciando importación de registros ESAVI graves desde DHIS2`,
      {
        loteId,
        usuario,
        metadata: {
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
          codigoATC,
          totalRegistros,
        },
      },
    );
  }

  /**
   * Log de fin de importación
   */
  logImportEnd(
    loteId: string,
    summary: ProcessingSummaryDto,
    usuario?: string,
  ): Dhis2ProcessingLogDto {
    return this.createLog(
      LogType.IMPORT_END,
      ProcessingStatus.SUCCESS,
      `Importación completada. Procesados: ${summary.registrosProcesados}/${summary.totalRegistros}`,
      {
        loteId,
        usuario,
        metadata: summary,
      },
    );
  }

  /**
   * Log de procesamiento de registro individual
   */
  logRecordProcessing(
    loteId: string,
    codigoDhis2Evento: string,
    identificacionPaciente: string,
    status: ProcessingStatus,
    mensaje: string,
    detalles?: string,
    error?: string,
  ): Dhis2ProcessingLogDto {
    return this.createLog(LogType.RECORD_PROCESSING, status, mensaje, {
      loteId,
      codigoDhis2Evento,
      identificacionPaciente,
      detalles,
      error,
    });
  }

  /**
   * Log de detección de duplicado
   */
  logDuplicateDetected(
    loteId: string,
    codigoDhis2Evento: string,
    identificacionPaciente: string,
    motivoDuplicado: string,
    datosExistentes?: any,
    datosNuevos?: any,
  ): Dhis2ProcessingLogDto {
    return this.createLog(
      LogType.DUPLICATE_DETECTED,
      ProcessingStatus.DUPLICATE_FOUND,
      `Registro duplicado detectado: ${codigoDhis2Evento}`,
      {
        loteId,
        codigoDhis2Evento,
        identificacionPaciente,
        detalles: motivoDuplicado,
        metadata: {
          datosExistentes,
          datosNuevos,
        },
      },
    );
  }

  /**
   * Log de resolución de duplicado
   */
  logDuplicateResolved(
    loteId: string,
    codigoDhis2Evento: string,
    accion: string,
    resultado: string,
  ): Dhis2ProcessingLogDto {
    return this.createLog(
      LogType.DUPLICATE_RESOLVED,
      ProcessingStatus.SUCCESS,
      `Duplicado resuelto: ${accion}`,
      {
        loteId,
        codigoDhis2Evento,
        detalles: resultado,
      },
    );
  }

  /**
   * Log de error
   */
  logError(
    loteId: string,
    mensaje: string,
    error: string,
    codigoDhis2Evento?: string,
    identificacionPaciente?: string,
  ): Dhis2ProcessingLogDto {
    return this.createLog(LogType.ERROR_OCCURRED, ProcessingStatus.ERROR, mensaje, {
      loteId,
      codigoDhis2Evento,
      identificacionPaciente,
      error,
    });
  }

  /**
   * Obtener logs por lote
   */
  getLogsByLote(loteId: string): Dhis2ProcessingLogDto[] {
    return this.processingLogs.get(loteId) || [];
  }

  /**
   * Obtener todos los logs
   */
  getAllLogs(): Dhis2ProcessingLogDto[] {
    const allLogs: Dhis2ProcessingLogDto[] = [];
    this.processingLogs.forEach((logs) => {
      allLogs.push(...logs);
    });
    return allLogs.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }

  /**
   * Crear resumen de procesamiento
   */
  createProcessingSummary(
    loteId: string,
    fechaInicio: Date,
    fechaFin: Date,
    codigoATC: string,
    totalRegistros: number,
  ): ProcessingSummaryDto {
    const summary: ProcessingSummaryDto = {
      loteId,
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
      codigoATC,
      totalRegistros,
      registrosProcesados: 0,
      registrosDuplicados: 0,
      registrosActualizados: 0,
      registrosOmitidos: 0,
      registrosConError: 0,
      estadisticas: {},
    };

    this.processingSummaries.set(loteId, summary);
    return summary;
  }

  /**
   * Actualizar resumen de procesamiento
   */
  updateProcessingSummary(loteId: string, updates: Partial<ProcessingSummaryDto>): void {
    const summary = this.processingSummaries.get(loteId);
    if (summary) {
      Object.assign(summary, updates);
      this.processingSummaries.set(loteId, summary);
    }
  }

  /**
   * Obtener resumen de procesamiento
   */
  getProcessingSummary(loteId: string): ProcessingSummaryDto | undefined {
    return this.processingSummaries.get(loteId);
  }

  /**
   * Log en consola con formato específico
   */
  private logToConsole(log: Dhis2ProcessingLogDto): void {
    const timestamp = new Date(log.timestamp).toLocaleString();
    const prefix = `[DHIS2-PROCESSING] ${timestamp}`;
    const context = log.codigoDhis2Evento ? `[${log.codigoDhis2Evento}]` : '';
    const message = `${prefix} ${context} [${log.tipo}] [${log.status}] ${log.mensaje}`;

    switch (log.status) {
      case ProcessingStatus.ERROR:
        this.logger.error(message, log.error);
        break;
      case ProcessingStatus.WARNING:
        this.logger.warn(message);
        break;
      case ProcessingStatus.SUCCESS:
        this.logger.log(message);
        break;
      default:
        this.logger.debug(message);
        break;
    }

    if (log.detalles) {
      this.logger.debug(`${prefix} Detalles: ${log.detalles}`);
    }
  }

  /**
   * Limpiar logs antiguos (mantener solo los últimos N días)
   */
  cleanOldLogs(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.processingLogs.forEach((logs, loteId) => {
      const filteredLogs = logs.filter((log) => new Date(log.timestamp) > cutoffDate);
      this.processingLogs.set(loteId, filteredLogs);
    });
  }
}
