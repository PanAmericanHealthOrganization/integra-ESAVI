import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DIMENSION_CALIDAD, DimensionCalidadDatosDto, SUB_DIMENSION_CALIDAD } from '../controllers/dto/quality.dto';
import { DataQualityUtils } from './utils/dataquality.utils';

export class DimCompletitudService {
  /**
   *
   * @param dataSource
   */
  constructor(
    @InjectDataSource('DATAQUALITY_DS')
    private readonly dataSource: DataSource,
  ) {}

  private readonly logger = new Logger(DimCompletitudService.name);

  /**
   *
   * @param day
   * @returns
   */
  async processAll(day: Date): Promise<DimensionCalidadDatosDto> {
    this.logger.log(`Iniciando procesamiento de Dimensión de Consistencia para el día ${day.toISOString()}`);
    const [fechaNacimientoMinima] = await Promise.all([this._completitudTablasObligatorias(day)]);
    return {
      dimension: DIMENSION_CALIDAD.COMPLETITUD,
      calidadTotal: DataQualityUtils.calcularCalidadDimension([...fechaNacimientoMinima]),
      deltaCalidadTotal: DataQualityUtils.calcularDeltaCalidad([...fechaNacimientoMinima], []),
      jsonDimensionQuality: [...fechaNacimientoMinima],
    };
  }

  /**
   *
   * @param day
   * @returns
   */
  private async _completitudTablasObligatorias(day: Date): Promise<any> {
    this.logger.log(`Iniciando evaluación de no fechas futuras para el día ${day.toISOString()}`);

    // Mapeo de tablas a sus columnas ID
    const tableIdMap = {
      TR_NOTIFICACION: 'ID',
      TR_PACIENTE: 'ID',
      TR_ESAVI_DURANTE_EMBARAZO: 'ID',
      TR_DATO_VACUNACION: 'ID',
      TR_DESENLACE_ESAVI: 'ID',
      TR_DATOS_ESAVI: 'ID',
    };

    const evaluacion = [
      {
        tabla: 'TR_NOTIFICACION',
        columnas: ['FECHA_ATENCION', 'FECHA_NOTIFICACION', 'FECHA_REPORTE_NACIONAL', 'FECHA_LLENADO_FICHA'],
      },
      {
        tabla: 'TR_PACIENTE',
        columnas: ['FECHA_NACIMIENTO'],
      },
      { tabla: 'TR_ESAVI_DURANTE_EMBARAZO', columnas: ['FECHAULTIMAMENSTRUACIONESAVI'] },
      { tabla: 'TR_DATO_VACUNACION', columnas: ['FECHA_VACUNACION'] },
      { tabla: 'TR_DESENLACE_ESAVI', columnas: ['FECHAMUERTE', 'FECHANOTIFICAMUERTE'] },
      { tabla: 'TR_PACIENTE', columnas: ['FECHA_NACIMIENTO'] },
    ];
    const resultados = [];
    for (const evalItem of evaluacion) {
      const idColumn = tableIdMap[evalItem.tabla] || 'ID';
      for (const columna of evalItem.columnas) {
        const query = `
            select
            count(tp."${columna}") filter (where tp."${columna}" is not null) as "totalRegistros",
            count(tp."${columna}") filter (where tp."${columna}" <= tp."AUD_FECHA_CREACION") "totalRegistrosValidos",
            count(tp."${columna}") filter (where tp."${columna}" > tp."AUD_FECHA_CREACION") "totalRegistrosNoValidos",
            coalesce(json_agg(DISTINCT tp."${idColumn}") filter (where tp."${columna}" > tp."AUD_FECHA_CREACION"), '[]') as "idNotificacionesNoValidos"
            from
              dhi_esavi."${evalItem.tabla}" tp
            where tp."AUD_FECHA_CREACION" <= '${day.toISOString()}';`;
        const result = await this.dataSource.query(query);
        //
        const totales = await DataQualityUtils.construirResultado(result);
        resultados.push({
          codigo: `CON_DOM_001_${(columna || '').toUpperCase()}`,
          subDimension: SUB_DIMENSION_CALIDAD.COMP_NO_NULL,
          regla: `No fechas futuras en ${evalItem.tabla}.${columna}`,
          condicion: `La columna ${columna} en la tabla ${evalItem.tabla} no debe contener fechas posteriores a la fecha de evaluación.`,
          descripcionRegla: `El valor es correcto cuando la fecha registrada en ${columna} es anterior o igual a la fecha de evaluación.`,
          ...totales,
        });
      }
    }
    return resultados;
  }
}
