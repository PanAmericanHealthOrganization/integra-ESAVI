import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CalidadDatosResultadoWhitMetadataDto,
  DIMENSION_CALIDAD,
  DimensionCalidadDatosDto,
} from '../controllers/dto/quality.dto';
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
  private async _completitudTablasObligatorias(day: Date): Promise<CalidadDatosResultadoWhitMetadataDto[]> {
    this.logger.log(`Iniciando evaluación de no fechas futuras para el día ${day.toISOString()}`);

    const evaluacion = [
      {
        tabla: 'TR_NOTIFICACION',
        columnas: ['FECHA_ATENCION', 'FECHA_NOTIFICACION', 'FECHA_REPORTE_NACIONAL', 'FECHA_LLENADO_FICHA'],
        fkColumn: 'ID',
        joinColumn: 'ID',
      },
      {
        tabla: 'TR_PACIENTE',
        columnas: ['FECHA_NACIMIENTO', 'CT_SEXO_ID'],
        fkColumn: 'PACIENTE_ID',
        joinColumn: 'ID',
      },
      { tabla: 'TR_DATO_VACUNACION', columnas: ['FECHA_VACUNACION'], fkColumn: 'ID', joinColumn: 'NOTIFICACION_ID' },
      {
        tabla: 'TR_DATOS_ESAVI',
        columnas: ['CODIGO_LLT', 'COGIDOCASO'],
        fkColumn: 'ID',
        joinColumn: 'NOTIFICACION_ID',
      },
    ];
    const resultados = [];
    for (const evalItem of evaluacion) {
      for (const columna of evalItem.columnas) {
        const query = `
            select
            count(tp."${columna}") as "totalRegistros",
            count(tp."${columna}") filter (where tp."${columna}" is not null) "totalRegistrosValidos",
            count(tp."${columna}") filter (where tp."${columna}" is null) "totalRegistrosNoValidos",
            coalesce(json_agg(DISTINCT tp."${
              evalItem.joinColumn
            }") filter (where tp."${columna}" is null), '[]') as "idNotificacionesNoValidos"
            from
              dhi_esavi."${evalItem.tabla}" tp inner 
              join dhi_esavi."TR_NOTIFICACION" tn
              on tn."${evalItem.fkColumn}" = tp."${evalItem.joinColumn}"
            where tn."FECHA_NOTIFICACION" <= '${day.toISOString()}';`;
        const result = await this.dataSource.query(query);
        //
        const totales = await DataQualityUtils.construirResultado(result);
        resultados.push({
          codigo: `CON_COM_001.${(columna || '').toUpperCase()}`,
          subDimension: evalItem.tabla,
          regla: `No debe existir valores nulos o vacios en ${evalItem.tabla}.${columna}`,
          condicion: `La columna ${columna} en la tabla ${evalItem.tabla} no debe vacios o nulos`,
          descripcionRegla: `La columna ${columna} en la tabla ${evalItem.tabla} debe contener valores no nulos para garantizar la completitud de los datos.`,
          metaDatos: {
            tabla: evalItem.tabla,
            columna: columna,
          },
          ...totales,
        });
      }
    }
    return resultados;
  }
}
