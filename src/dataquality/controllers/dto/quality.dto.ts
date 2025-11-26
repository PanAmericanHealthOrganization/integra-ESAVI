import { IsArray, IsInt, IsString } from 'class-validator';

export class TotalesCalidDatosDto {
  /**
   *
   */
  @IsInt()
  totalRegistros: number;

  /**
   *
   */
  @IsInt()
  totalRegistrosValidos: number;

  /**
   *
   */
  @IsInt()
  totalRegistrosInvalidos: number;

  /**
   *
   */
  @IsInt()
  porcentajeRegistrosValidos: number;

  /**
   *
   */
  @IsInt()
  porcentajeRegistrosInvalidos: number;

  /**
   * Determines whether array is
   */
  @IsArray()
  idNotificacionesNoValidos: string[];
}

export class CalidadDatosResultadoDto extends TotalesCalidDatosDto {
  /**
   * Codigo  of calidad datos resultado dto
   */
  codigo: string;

  /**
   *
   */
  @IsString()
  tipo: string;

  /**
   *
   */
  @IsString()
  regla: string;

  /**
   *
   */
  @IsString()
  condicion: string;

  /**
   *
   */
  @IsString()
  descripcionRegla: string;
}

export class DimensionCalidadDatosDto {
  dimension: string;
  calidadDimension: number;
  jsonQuality: CalidadDatosResultadoDto[];
}

export class QualityDto {
  id?: string;
  fecha: Date;
  jsonQuality: DimensionCalidadDatosDto[];
}
