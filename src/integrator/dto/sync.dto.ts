import { OmitType, PartialType } from '@nestjs/swagger';
import { IAuditoria } from '../entity';

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
  status: string;
  /**
   * Fecha y hora de inicio del proceso de sincronización
   */
  startTime: Date;
  /**
   * Fecha y hora de fin del proceso de sincronización
   */
  endTime: Date;
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

export class SyncDto {
  id: string;
  name: string;
  status: string;
  startTime: Date;
  endTime: Date;
  errorMessage: string;
  errorStack: string;
  errorTrace: string;
}

export class CreateSyncDto extends OmitType(SyncDto, ['id'] as const) {}

export class UpdateSyncDto extends PartialType(OmitType(SyncDto, ['id'] as const)) {}
