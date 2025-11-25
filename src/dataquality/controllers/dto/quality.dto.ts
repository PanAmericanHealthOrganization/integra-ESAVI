import { IsInt, IsString } from 'class-validator';

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
}

export class CalidadDatosResultadoDto extends TotalesCalidDatosDto {
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
