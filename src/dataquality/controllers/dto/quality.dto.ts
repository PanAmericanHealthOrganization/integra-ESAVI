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
  @IsString()
  codigo: string;

  /**
   *
   */
  @IsString()
  subDimension: string;

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

export class QualityDto {
  id?: string;
  fecha: Date;
  jsonQuality: DimensionCalidadDatosDto[];
}

export enum DIMENSION_CALIDAD {
  EXACTITUD = 'Dimensión de Exactitud',
  CONSISTENCIA = 'Dimensión de Consistencia',
  COMPLETITUD = 'Dimensión de Completitud',
}

export enum SUB_DIMENSION_CALIDAD {
  EXAC_SINTACTICA = 'Dimensión de Exactitud Sintáctica',
  EXAC_SEMANTICA = 'Dimensión de Exactitud Semántica',
  CONS_DOMINIO = 'Dimensión de Consistencia de Dominio',
  CONS_INTRARELACION = 'Dimensión de Consistencia de Formato',
  CONS_INTERRELACION = 'Dimensión de Consistencia de Interrelación',
  COMP_NO_NULL = 'Dimensión de Completitud No Nulo',
}

export class DimensionCalidadDatosDto {
  dimension: DIMENSION_CALIDAD;
  calidadTotal: number;
  deltaCalidadTotal: number;
  jsonDimensionQuality: CalidadDatosResultadoDto[];
}
