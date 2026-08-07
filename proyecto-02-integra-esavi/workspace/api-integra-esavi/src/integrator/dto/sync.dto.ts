import { OmitType, PartialType } from '@nestjs/swagger';
import { IAuditoria, SyncSource, SyncStatus } from '../entity';

/**
 * Una corrida de sincronización, tal como se registra en TR_SYNC_PROCESS.
 */
export interface ISync extends IAuditoria {
  /** Identificador único de la corrida */
  id?: string;
  /** Fuente sincronizada */
  source: SyncSource;
  /** Descripción legible de la corrida */
  name: string;
  /** Estado: RUNNING, COMPLETED o FAILED */
  status: SyncStatus;
  /** Fecha y hora de inicio */
  startTime: Date;
  /** Fecha y hora de fin. Nulo mientras sigue en curso */
  endTime: Date;
  /** Resumen del resultado cuando termina en COMPLETED */
  message?: string;
  /** Mensaje del error que dejó la corrida en FAILED */
  errorMessage: string;
  /** Stack trace del error */
  errorStack: string;
  /** Inicio del rango de datos importados */
  dataStartDate?: Date;
  /** Fin del rango de datos importados */
  dataEndDate?: Date;
  /** Datos específicos de la fuente (versión, sha256, conteos, ...) */
  metadata?: Record<string, any>;
}

export class SyncDto {
  id: string;
  source: SyncSource;
  name: string;
  status: SyncStatus;
  startTime: Date;
  endTime: Date;
  message?: string;
  errorMessage: string;
  errorStack: string;
  dataStartDate?: Date;
  dataEndDate?: Date;
  metadata?: Record<string, any>;
}

export class CreateSyncDto extends OmitType(SyncDto, ['id'] as const) {}

export class UpdateSyncDto extends PartialType(OmitType(SyncDto, ['id'] as const)) {}
