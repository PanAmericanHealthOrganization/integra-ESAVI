export class QualityDto {
  id?: string;
  fecha: Date;
  dimension: string;
  jsonQuality: GeneralQualityDto;
}

export class GeneralQualityDto {
  totalRegistros: number;
  totalErrores: number;
  totalPorcentaje: number;
  completenessQualityTable: CompletenessQualityTableDto[];
  sintacticQuality: SintacticQualityDto[];
  semanticQuality: SemanticQualityTableDto[];
  temporalQuality: TemporalQualityTableDto[];
}

export class CompletenessQualityTableDto {
  tableName: string;
  columnName: string;
  columnDescription: string;
  totalRecords: number;
  totalNulls: number;
  totalNonNulls: number;
  completenessPercentage: number;
}

export class SintacticQualityDto {
  regla: string;
  condicion: string;
  descripcionRegla: string;
  totalRegistros: number;
  totalRegistrosValidos: number;
  totalRegistrosInvalidos: number;
  porcentajeRegistrosValidos: number;
  porcentajeRegistrosInvalidos: number;
}

export class SemanticQualityTableDto {
  ruleCode: string;
  ruleName: string;
  ruleDescription: string;
  totalRecords: number;
  totalRegistrosValidos: number;
  totalRegistrosInvalidos: number;
  porcentajeRegistrosValidos: number;
  porcentajeRegistrosInvalidos: number;
}

export class TemporalQualityTableDto {
  ruleCode: string;
  ruleName: string;
  ruleDescription: string;
  totalRecords: number;
  totalRegistrosValidos: number;
  totalRegistrosInvalidos: number;
  porcentajeRegistrosValidos: number;
  porcentajeRegistrosInvalidos: number;
}
