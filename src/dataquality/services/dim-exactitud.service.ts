import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CalidadDatosResultadoDto,
  DIMENSION_CALIDAD,
  DimensionCalidadDatosDto,
  SUB_DIMENSION_CALIDAD,
} from '../controllers/dto/quality.dto';
import { DataQualityUtils } from './utils/dataquality.utils';

export class DimExactitudService {
  constructor(
    @InjectDataSource('DATAQUALITY_DS')
    private readonly dataSource: DataSource,
  ) {}

  /**
   *
   * @param day
   * @returns
   */
  async processAll(day: Date): Promise<DimensionCalidadDatosDto> {
    const [camposNumeros, edadInicioEvaento, nombreVacunaDominio] = await Promise.all([
      this._camposNumeros(day),
      this._edadInicioEvento(day),
      this._nombreVacunaDominio(day),
    ]);
    return {
      dimension: DIMENSION_CALIDAD.EXACTITUD,
      calidadTotal: DataQualityUtils.calcularCalidadDimension([
        ...camposNumeros,
        edadInicioEvaento,
        nombreVacunaDominio,
      ]),
      deltaCalidadTotal: DataQualityUtils.calcularDeltaCalidad(
        [...camposNumeros, edadInicioEvaento, nombreVacunaDominio],
        [],
      ),
      jsonDimensionQuality: [...camposNumeros, edadInicioEvaento, nombreVacunaDominio],
    };
  }

  /**
   * Calidad edad al inicio del evento
   * @param day
   * @returns
   */
  private async _edadInicioEvento(day: Date): Promise<CalidadDatosResultadoDto> {
    const query = `
        select
        count(tn."EDAD") as "totalRegistros",
        count(tn."EDAD") filter (where tn."EDAD" is not null) "totalRegistrosValidos",
        count(tn."EDAD") filter (where tn."EDAD" is null) "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT tn."ID") filter (where tn."EDAD" is null), '[]') as "idNotificacionesNoValidos"
        from
          dhi_esavi."TR_NOTIFICACION" tn
        inner join dhi_esavi."TR_PACIENTE" tp on tn."PACIENTE_ID" = tp."ID"
        where tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
        ;
    `;
    const result = await this.dataSource.query(query);
    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'EXA_SEM_001',
      subDimension: SUB_DIMENSION_CALIDAD.EXAC_SEMANTICA,
      regla: 'Edad al inicio del evento',
      condicion: 'FECHA_ESAVI - FECHA_NACIMIENTO - =Edad al inicio del evento',
      descripcionRegla: 'La edad registrada  debe ser la edad de la persona al inicio del evento.',
      ...totales,
    };
  }

  /**
   *
   * @param day
   * @returns
   */
  private async _nombreVacunaDominio(day: Date): Promise<CalidadDatosResultadoDto> {
    const listaVacunas = ['COVID 19', 'HB ADULTO', 'PENTAVALENTE']; // Ejemplo de dominio de vacunas
    const query = `
    select
    count(tn."NOMBRE_VACUNA") filter (where tn."NOMBRE_VACUNA" is not null) as "totalRegistros",
    count(tn."NOMBRE_VACUNA") filter (where tn."NOMBRE_VACUNA" in (${listaVacunas
      .map((v) => `'${v}'`)
      .join(', ')})) "totalRegistrosValidos",
    count(tn."NOMBRE_VACUNA") filter (where tn."NOMBRE_VACUNA" not in (${listaVacunas
      .map((v) => `'${v}'`)
      .join(', ')})) "totalRegistrosNoValidos"
    ,coalesce(json_agg(DISTINCT tn."NOTIFICACION_ID") filter (where tn."NOMBRE_VACUNA" not in (${listaVacunas
      .map((v) => `'${v}'`)
      .join(', ')})), '[]') as "idNotificacionesNoValidos"
    from
      dhi_esavi."TR_DATO_VACUNA" tn
    where tn."AUD_FECHA_CREACION" <= '${day.toISOString()}'
    `;
    const result = await this.dataSource.query(query);
    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'EXA_SEM_002',
      subDimension: SUB_DIMENSION_CALIDAD.EXAC_SEMANTICA,
      regla: 'Nombre vacuna',
      condicion:
        'Comparar cada valor único de vacuna registrado en NOMBRE_VACUNA con catalogo de referencia nacional de vacunas. ',
      descripcionRegla:
        'El nombre de la vacuna registrado debe corresponder a una vacuna dentro del catalogo nacional de referencia',
      ...totales,
    };
  }

  private async _camposNumeros(day: Date): Promise<CalidadDatosResultadoDto[]> {
    const tablasYCampos = [
      { tabla: 'TR_NOTIFICACION', campo: 'EDAD', minValor: 0, maxValor: 120 },
      { tabla: 'TR_DESENLACE_ESAVI', campo: 'AUTOPSIA', minValor: 4, maxValor: 4 },
    ];
    const resultados: CalidadDatosResultadoDto[] = [];
    for (const item of tablasYCampos) {
      const query = `
        select
        count(tn."${item.campo}") as "totalRegistros",
        count(tn."${item.campo}") filter (where tn."${item.campo}" between ${item.minValor} and ${
        item.maxValor
      }) "totalRegistrosValidos",
        count(tn."${item.campo}") filter (where tn."${item.campo}" < ${item.minValor} or tn."${item.campo}" > ${
        item.maxValor
      }) "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT tn."ID") filter (where tn."${item.campo}" < ${item.minValor} or tn."${
        item.campo
      }" > ${item.maxValor}), '[]') as "idNotificacionesNoValidos"
        from
          dhi_esavi."${item.tabla}" tn
        where tn."AUD_FECHA_CREACION" <= '${day.toISOString()}'
        ;
    `;
      const result = await this.dataSource.query(query);
      //
      const totales = await DataQualityUtils.construirResultado(result);
      resultados.push({
        codigo: 'EXA_SIN_003.' + item.tabla + '.' + item.campo,
        subDimension: SUB_DIMENSION_CALIDAD.EXAC_SINTACTICA,
        regla: `Campo numérico ${item.campo} en tabla ${item.tabla}`,
        condicion: `${item.campo} entre ${item.minValor} y ${item.maxValor}`,
        descripcionRegla: `El campo ${item.campo} en la tabla ${item.tabla} debe tener valores entre ${item.minValor} y ${item.maxValor}.`,
        ...totales,
      });
    }
    return resultados;
  }
}
