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
  tableName: string;
  columnName: string;
  columnDescription: string;
  validRecords: number;
  invalidRecords: number;
  percentageValidRecords: number;
}

export class SemanticQualityTableDto {
  tableName: string;
  columnName: string;
  columnDescription: string;
  validRecords: number;
  invalidRecords: number;
  percentageValidRecords: number;
}

export class TemporalQualityTableDto {
  tableName: string;
  columnName: string;
  columnDescription: string;
  validRecords: number;
  invalidRecords: number;
  percentageValidRecords: number;
}
