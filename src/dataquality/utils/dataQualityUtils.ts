import { HistoryQualityDto, SumaryDataQualityDto } from '../controllers/dto/historyQuality.dto';
import { DimensionCalidadDatosDto } from '../controllers/dto/quality.dto';
import { DataQualityDimensions } from '../entities/dataQualityDimensions.entity';

/**
 *
 * @param t
 * @returns
 */
export const convertirAHistoryQualityDto = (t: DataQualityDimensions[]): HistoryQualityDto[] => {
  return t.map((record) => {
    const jsonQuality = JSON.parse(record.jsonQuality) as DimensionCalidadDatosDto[];
    const sumaryDataQuality: SumaryDataQualityDto[] = jsonQuality.map((dim) => {
      const calidadTotal = dim.calidadTotal;
      return {
        dimension: dim.dimension,
        calidadTotal: parseFloat(calidadTotal.toFixed(2)),
      };
    });

    return {
      anio: record.anio,
      mes: record.mes,
      sumaryDataQuality,
    };
  });
};
