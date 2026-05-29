import { IsArray, IsInt, IsString } from 'class-validator';

export interface IDataQualityDimensions {
  id?: number;

  anio: number;

  mes: number;

  jsonQuality: string;
}

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

export class CalidadDatosResultadoWhitMetadataDto extends CalidadDatosResultadoDto {
  metaData: any;
}

export class QualityDto {
  id?: string;
  @IsInt()
  anio: number;
  @IsInt()
  mes: number;
  @IsArray()
  jsonQuality: DimensionCalidadDatosDto[];
}

export enum DIMENSION_CALIDAD {
  EXACTITUD = 'Exactitud',
  CONSISTENCIA = 'Consistencia',
  COMPLETITUD = 'Completitud',
}

export enum SUB_DIMENSION_CALIDAD {
  EXAC_SINTACTICA = 'Sintáctica',
  EXAC_SEMANTICA = 'Semántica',
  CONS_DOMINIO = 'Dominio',
  CONS_INTRARELACION = 'Intrarelación',
  CONS_INTERRELACION = 'Interrelación',
  COMP_NO_NULL = 'Completitud',
}

export class DimensionCalidadDatosDto {
  dimension: DIMENSION_CALIDAD;
  calidadTotal: number;
  deltaCalidadTotal: number;
  jsonDimensionQuality: CalidadDatosResultadoDto[];
}
