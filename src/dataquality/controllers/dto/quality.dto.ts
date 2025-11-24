export class TotalesCalidDatosDto {
  totalRegistros: number;
  totalRegistrosValidos: number;
  totalRegistrosInvalidos: number;
  porcentajeRegistrosValidos: number;
  porcentajeRegistrosInvalidos: number;
}

export class CalidadDatosResultadoDto extends TotalesCalidDatosDto {
  tipo: string;
  regla: string;
  condicion: string;
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
