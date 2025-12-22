import { OmitType, PartialType } from '@nestjs/swagger';
import { IAuditoria, SyncStatus } from '../entity';

/**
 *
 */
export interface ISync extends IAuditoria {
  /**
   * Identificador único del proceso de sincronización
   */
  id?: string;
  /**
   * Nombre del proceso de sincronización
   */
  name: string;
  /**
   * Estado del proceso de sincronización
   */
  //status: string;
  status: SyncStatus;//Se podría utilizar un tipo enumerado "enum"
  /**
   * Fecha y hora de inicio del proceso de sincronización
   */
  startTime: Date;
  /**
   * Fecha y hora de fin del proceso de sincronización
   */
  endTime: Date;
  /**
   * Mensaje de éxito del proceso de sincronización
   */
  message?: string;
  /**
   * Mensaje de error del proceso de sincronización
   */  
  errorMessage: string;
  /**
   * Stack del error del proceso de sincronización
   */
  errorStack: string;
  /**
   * Trace del error del proceso de sincronización
   */
  errorTrace: string;
}
/*export enum SyncStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}*/

export class SyncDto {
  id: string;
  name: string;
  status: SyncStatus;
  startTime: Date;
  endTime: Date;
  message?: string;
  errorMessage: string;
  errorStack: string;
  errorTrace: string;
}

export class CreateSyncDto extends OmitType(SyncDto, ['id'] as const) {}

export class UpdateSyncDto extends PartialType(OmitType(SyncDto, ['id'] as const)) {}
