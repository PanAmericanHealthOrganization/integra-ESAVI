import { Injectable, Logger } from '@nestjs/common';
import { 
  DuplicateAction, 
  DuplicateRecordDto, 
  DuplicateConfirmationDto, 
  DuplicateHandlingConfigDto,
  DuplicateHandlingResultDto 
} from '../dto/duplicate-handling.dto';
import { Dhis2ProcessingLogService } from './dhis2-processing-log.service';
import { IntegradorService } from '../../integrator/facade/integrador.service';
import { CreateCompleteDto } from '../../integrator/dto/create-complete.dto';

@Injectable()
export class Dhis2DuplicateHandlerService {
  private readonly logger = new Logger(Dhis2DuplicateHandlerService.name);
  private readonly pendingDuplicates: Map<string, DuplicateRecordDto> = new Map();
  private readonly duplicateConfigurations: Map<string, DuplicateAction> = new Map();
  private readonly globalConfiguration: DuplicateHandlingConfigDto = {
    accionPorDefecto: DuplicateAction.ASK_CONFIRMATION,
    confirmarAntesDeProcesar: true,
    logDetallado: true
  };

  constructor(
    private readonly processingLogService: Dhis2ProcessingLogService,
    private readonly integradorService: IntegradorService
  ) {}

  /**
   * Detecta si un registro es duplicado
   */
  async detectDuplicate(
    codigoDhis2Evento: string,
    identificacionPaciente: string,
    loteId: string
  ): Promise<{ isDuplicate: boolean; existingRecord?: any; reason?: string }> {
    try {
      // Buscar registro existente por código DHIS2
      const existingByCode = await this.integradorService.findByCodigoDhis2Evento(codigoDhis2Evento);
      if (existingByCode) {
        return {
          isDuplicate: true,
          existingRecord: existingByCode,
          reason: `Registro con código DHIS2 ${codigoDhis2Evento} ya existe`
        };
      }

      // Buscar registro existente por identificación de paciente y fecha similar
      const existingByPatient = await this.integradorService.findByIdentificacionAndDateRange(
        identificacionPaciente,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
        new Date()
      );
      
      if (existingByPatient && existingByPatient.length > 0) {
        return {
          isDuplicate: true,
          existingRecord: existingByPatient[0],
          reason: `Paciente ${identificacionPaciente} tiene registros similares en los últimos 30 días`
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      this.logger.error(`Error detectando duplicado: ${error.message}`, error.stack);
      this.processingLogService.logError(
        loteId,
        `Error detectando duplicado para ${codigoDhis2Evento}`,
        error.message,
        codigoDhis2Evento,
        identificacionPaciente
      );
      return { isDuplicate: false };
    }
  }

  /**
   * Maneja un registro duplicado según la configuración
   */
  async handleDuplicate(
    duplicateRecord: DuplicateRecordDto,
    newRecord: CreateCompleteDto,
    loteId: string,
    config?: DuplicateHandlingConfigDto
  ): Promise<DuplicateHandlingResultDto> {
    const effectiveConfig = config || this.globalConfiguration;
    const action = this.duplicateConfigurations.get(duplicateRecord.codigoDhis2Evento) || 
                  effectiveConfig.accionPorDefecto;

    this.processingLogService.logDuplicateDetected(
      loteId,
      duplicateRecord.codigoDhis2Evento,
      duplicateRecord.identificacionPaciente,
      duplicateRecord.motivoDuplicado || 'Registro duplicado detectado',
      duplicateRecord.datosExistentes,
      duplicateRecord.datosNuevos
    );

    try {
      switch (action) {
        case DuplicateAction.SKIP:
          return await this.skipDuplicate(duplicateRecord, loteId);

        case DuplicateAction.UPDATE_INDIVIDUAL:
          return await this.updateIndividualDuplicate(duplicateRecord, newRecord, loteId);

        case DuplicateAction.UPDATE_ALL:
          return await this.updateAllDuplicates(duplicateRecord, newRecord, loteId);

        case DuplicateAction.ASK_CONFIRMATION:
          return await this.askConfirmation(duplicateRecord, loteId);

        default:
          return await this.skipDuplicate(duplicateRecord, loteId);
      }
    } catch (error) {
      this.logger.error(`Error manejando duplicado: ${error.message}`, error.stack);
      return {
        codigoDhis2Evento: duplicateRecord.codigoDhis2Evento,
        accionTomada: DuplicateAction.SKIP,
        procesado: false,
        error: error.message
      };
    }
  }

  /**
   * Omite el registro duplicado
   */
  private async skipDuplicate(
    duplicateRecord: DuplicateRecordDto,
    loteId: string
  ): Promise<DuplicateHandlingResultDto> {
    this.processingLogService.logDuplicateResolved(
      loteId,
      duplicateRecord.codigoDhis2Evento,
      'OMITIR',
      'Registro duplicado omitido según configuración'
    );

    return {
      codigoDhis2Evento: duplicateRecord.codigoDhis2Evento,
      accionTomada: DuplicateAction.SKIP,
      procesado: true,
      mensaje: 'Registro duplicado omitido'
    };
  }

  /**
   * Actualiza el registro duplicado individual
   */
  private async updateIndividualDuplicate(
    duplicateRecord: DuplicateRecordDto,
    newRecord: CreateCompleteDto,
    loteId: string
  ): Promise<DuplicateHandlingResultDto> {
    try {
      // Actualizar el registro existente con los nuevos datos
      await this.integradorService.updateByCodigoDhis2Evento(
        duplicateRecord.codigoDhis2Evento,
        newRecord
      );

      this.processingLogService.logDuplicateResolved(
        loteId,
        duplicateRecord.codigoDhis2Evento,
        'ACTUALIZAR_INDIVIDUAL',
        'Registro duplicado actualizado individualmente'
      );

      return {
        codigoDhis2Evento: duplicateRecord.codigoDhis2Evento,
        accionTomada: DuplicateAction.UPDATE_INDIVIDUAL,
        procesado: true,
        mensaje: 'Registro duplicado actualizado individualmente'
      };
    } catch (error) {
      this.logger.error(`Error actualizando duplicado individual: ${error.message}`, error.stack);
      return {
        codigoDhis2Evento: duplicateRecord.codigoDhis2Evento,
        accionTomada: DuplicateAction.UPDATE_INDIVIDUAL,
        procesado: false,
        error: error.message
      };
    }
  }

  /**
   * Actualiza todos los registros duplicados
   */
  private async updateAllDuplicates(
    duplicateRecord: DuplicateRecordDto,
    newRecord: CreateCompleteDto,
    loteId: string
  ): Promise<DuplicateHandlingResultDto> {
    try {
      // Buscar y actualizar todos los registros similares
      const similarRecords = await this.integradorService.findSimilarRecords(
        duplicateRecord.identificacionPaciente,
        duplicateRecord.fechaNotificacion
      );

      let updatedCount = 0;
      for (const record of similarRecords) {
        await this.integradorService.updateByCodigoDhis2Evento(
          record.codigoDhis2Evento,
          newRecord
        );
        updatedCount++;
      }

      this.processingLogService.logDuplicateResolved(
        loteId,
        duplicateRecord.codigoDhis2Evento,
        'ACTUALIZAR_TODOS',
        `${updatedCount} registros similares actualizados`
      );

      return {
        codigoDhis2Evento: duplicateRecord.codigoDhis2Evento,
        accionTomada: DuplicateAction.UPDATE_ALL,
        procesado: true,
        mensaje: `${updatedCount} registros similares actualizados`
      };
    } catch (error) {
      this.logger.error(`Error actualizando todos los duplicados: ${error.message}`, error.stack);
      return {
        codigoDhis2Evento: duplicateRecord.codigoDhis2Evento,
        accionTomada: DuplicateAction.UPDATE_ALL,
        procesado: false,
        error: error.message
      };
    }
  }

  /**
   * Solicita confirmación para el manejo del duplicado
   */
  private async askConfirmation(
    duplicateRecord: DuplicateRecordDto,
    loteId: string
  ): Promise<DuplicateHandlingResultDto> {
    // Almacenar el duplicado pendiente para confirmación
    this.pendingDuplicates.set(duplicateRecord.codigoDhis2Evento, duplicateRecord);

    this.processingLogService.logDuplicateDetected(
      loteId,
      duplicateRecord.codigoDhis2Evento,
      duplicateRecord.identificacionPaciente,
      'Esperando confirmación del usuario',
      duplicateRecord.datosExistentes,
      duplicateRecord.datosNuevos
    );

    return {
      codigoDhis2Evento: duplicateRecord.codigoDhis2Evento,
      accionTomada: DuplicateAction.ASK_CONFIRMATION,
      procesado: false,
      mensaje: 'Esperando confirmación del usuario para procesar duplicado'
    };
  }

  /**
   * Procesa la confirmación de un duplicado
   */
  async processConfirmation(
    confirmation: DuplicateConfirmationDto,
    newRecord: CreateCompleteDto,
    loteId: string
  ): Promise<DuplicateHandlingResultDto> {
    const duplicateRecord = this.pendingDuplicates.get(confirmation.codigoDhis2Evento);
    if (!duplicateRecord) {
      return {
        codigoDhis2Evento: confirmation.codigoDhis2Evento,
        accionTomada: DuplicateAction.SKIP,
        procesado: false,
        error: 'Registro duplicado no encontrado en pendientes'
      };
    }

    // Aplicar la acción seleccionada
    const result = await this.handleDuplicate(
      duplicateRecord,
      newRecord,
      loteId,
      { accionPorDefecto: confirmation.accion }
    );

    // Si se aplica a todos, actualizar la configuración global
    if (confirmation.aplicarATodos) {
      this.duplicateConfigurations.set(confirmation.codigoDhis2Evento, confirmation.accion);
    }

    // Remover de pendientes
    this.pendingDuplicates.delete(confirmation.codigoDhis2Evento);

    return result;
  }

  /**
   * Obtiene duplicados pendientes de confirmación
   */
  getPendingDuplicates(): DuplicateRecordDto[] {
    return Array.from(this.pendingDuplicates.values());
  }

  /**
   * Obtiene un duplicado pendiente específico
   */
  getPendingDuplicate(codigoDhis2Evento: string): DuplicateRecordDto | undefined {
    return this.pendingDuplicates.get(codigoDhis2Evento);
  }

  /**
   * Configura la acción por defecto para duplicados
   */
  setDefaultAction(action: DuplicateAction): void {
    this.globalConfiguration.accionPorDefecto = action;
  }

  /**
   * Configura la acción para un registro específico
   */
  setActionForRecord(codigoDhis2Evento: string, action: DuplicateAction): void {
    this.duplicateConfigurations.set(codigoDhis2Evento, action);
  }

  /**
   * Limpia duplicados pendientes antiguos
   */
  cleanOldPendingDuplicates(maxAgeHours: number = 24): void {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    for (const [codigo, duplicate] of this.pendingDuplicates.entries()) {
      // Asumir que el timestamp está en los metadatos o usar fecha de creación
      const duplicateTime = new Date(duplicate.fechaNotificacion).getTime();
      if (duplicateTime < cutoffTime) {
        this.pendingDuplicates.delete(codigo);
        this.logger.warn(`Duplicado pendiente expirado removido: ${codigo}`);
      }
    }
  }
}

