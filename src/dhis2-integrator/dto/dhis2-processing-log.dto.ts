import { IsEnum, IsString, IsOptional, IsDateString, IsObject } from 'class-validator';

export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DUPLICATE_FOUND = 'DUPLICATE_FOUND',
  SKIPPED = 'SKIPPED',
  UPDATED = 'UPDATED'
}

export enum LogType {
  IMPORT_START = 'IMPORT_START',
  IMPORT_END = 'IMPORT_END',
  RECORD_PROCESSING = 'RECORD_PROCESSING',
  DUPLICATE_DETECTED = 'DUPLICATE_DETECTED',
  DUPLICATE_RESOLVED = 'DUPLICATE_RESOLVED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  BATCH_COMPLETED = 'BATCH_COMPLETED'
}

export class Dhis2ProcessingLogDto {
  @IsString()
  id: string;

  @IsEnum(LogType)
  tipo: LogType;

  @IsEnum(ProcessingStatus)
  status: ProcessingStatus;

  @IsString()
  @IsOptional()
  codigoDhis2Evento?: string;

  @IsString()
  @IsOptional()
  identificacionPaciente?: string;

  @IsString()
  mensaje: string;

  @IsString()
  @IsOptional()
  detalles?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsDateString()
  timestamp: string;

  @IsString()
  @IsOptional()
  usuario?: string;

  @IsString()
  @IsOptional()
  loteId?: string;

  @IsString()
  @IsOptional()
  error?: string;
}

export class ProcessingSummaryDto {
  @IsString()
  loteId: string;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsString()
  codigoATC: string;

  totalRegistros: number;
  registrosProcesados: number;
  registrosDuplicados: number;
  registrosActualizados: number;
  registrosOmitidos: number;
  registrosConError: number;

  @IsString()
  @IsOptional()
  duracionProcesamiento?: string;

  @IsObject()
  @IsOptional()
  estadisticas?: Record<string, any>;
}
