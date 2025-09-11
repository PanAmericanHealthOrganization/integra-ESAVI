import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';

export enum DuplicateAction {
  SKIP = 'SKIP',
  UPDATE_INDIVIDUAL = 'UPDATE_INDIVIDUAL',
  UPDATE_ALL = 'UPDATE_ALL',
  ASK_CONFIRMATION = 'ASK_CONFIRMATION'
}

export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

export class DuplicateRecordDto {
  @IsString()
  codigoDhis2Evento: string;

  @IsString()
  identificacionPaciente: string;

  @IsString()
  fechaNotificacion: string;

  @IsString()
  @IsOptional()
  motivoDuplicado?: string;

  @IsString()
  @IsOptional()
  datosExistentes?: string;

  @IsString()
  @IsOptional()
  datosNuevos?: string;
}

export class DuplicateConfirmationDto {
  @IsString()
  codigoDhis2Evento: string;

  @IsEnum(DuplicateAction)
  accion: DuplicateAction;

  @IsBoolean()
  @IsOptional()
  aplicarATodos?: boolean;

  @IsString()
  @IsOptional()
  motivo?: string;
}

export class DuplicateHandlingConfigDto {
  @IsEnum(DuplicateAction)
  accionPorDefecto: DuplicateAction = DuplicateAction.ASK_CONFIRMATION;

  @IsBoolean()
  @IsOptional()
  confirmarAntesDeProcesar?: boolean = true;

  @IsBoolean()
  @IsOptional()
  logDetallado?: boolean = true;
}

export class DuplicateHandlingResultDto {
  @IsString()
  codigoDhis2Evento: string;

  @IsEnum(DuplicateAction)
  accionTomada: DuplicateAction;

  @IsBoolean()
  procesado: boolean;

  @IsString()
  @IsOptional()
  mensaje?: string;

  @IsString()
  @IsOptional()
  error?: string;
}

