import { CalidadDatosResultadoDto, TotalesCalidDatosDto } from 'src/dataquality/controllers/dto/quality.dto';

/**
 *
 */
export class DataQualityUtils {
  /**
   *
   * @param result
   * @returns
   */
  static async construirResultado(result: any[]): Promise<TotalesCalidDatosDto> {
    if (!result || result.length === 0) {
      return {
        totalRegistros: 0,
        totalRegistrosValidos: 0,
        totalRegistrosInvalidos: 0,
        porcentajeRegistrosValidos: 0,
        porcentajeRegistrosInvalidos: 0,
        idNotificacionesNoValidos: [],
      };
    }
    const { totalRegistros, totalRegistrosValidos, totalRegistrosInvalidos, idNotificacionesNoValidos } = result[0];

    const porcentajeRegistrosValidos = totalRegistros !== 0 ? (totalRegistrosValidos / totalRegistros) * 100 : 0;
    const porcentajeRegistrosInvalidos = totalRegistros !== 0 ? (totalRegistrosInvalidos / totalRegistros) * 100 : 0;

    return {
      totalRegistros,
      totalRegistrosValidos,
      totalRegistrosInvalidos,
      porcentajeRegistrosValidos,
      porcentajeRegistrosInvalidos,
      idNotificacionesNoValidos,
    };
  }

  static calcularCalidadDimension(resultados: CalidadDatosResultadoDto[]): number {
    if (!resultados || resultados.length === 0) {
      return 0;
    }
    const totalRegistros = resultados.reduce((sum, res) => sum + res.totalRegistros, 0);
    const totalRegistrosValidos = resultados.reduce((sum, res) => sum + res.totalRegistrosValidos, 0);

    return totalRegistros !== 0 ? (totalRegistrosValidos / totalRegistros) * 100 : 0;
  }
}
