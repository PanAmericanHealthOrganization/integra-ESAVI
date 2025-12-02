export class SumaryDataQualityDto {
  dimension: string;
  calidadTotal: number;
}

export class HistoryQualityDto {
  anio: number;
  mes: number;
  sumaryDataQuality: SumaryDataQualityDto[];
}
