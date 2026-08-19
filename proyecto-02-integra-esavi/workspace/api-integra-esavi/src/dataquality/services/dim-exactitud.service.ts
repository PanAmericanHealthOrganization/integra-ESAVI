import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CalidadDatosResultadoDto,
  DIMENSION_CALIDAD,
  DimensionCalidadDatosDto,
  SUB_DIMENSION_CALIDAD,
} from '../controllers/dto';
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
    // histprico
    const previousMonth = new Date(day);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const [camposNumerosHistorico, edadInicioEvaenoHistorico, nombreVacunaDominioHistorico] = await Promise.all([
      this._camposNumeros(previousMonth),
      this._edadInicioEvento(previousMonth),
      this._nombreVacunaDominio(previousMonth),
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
        [...camposNumerosHistorico, edadInicioEvaenoHistorico, nombreVacunaDominioHistorico],
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
    // La versión anterior contaba count("EDAD") y lo comparaba contra sí mismo, así que daba
    // 100% pasara lo que pasara y nunca llegaba a comparar la edad con las fechas, que es lo
    // que la regla declara. Ahora sí contrasta la edad registrada contra la que se deduce de
    // FECHA_NACIMIENTO y el inicio del evento.
    //
    // Criterios asumidos, ambos cambiables en este único punto:
    //  - el inicio del evento es la FECHA_ESAVI más temprana de la notificación;
    //  - se tolera 1 año de diferencia, suficiente para dejar pasar el redondeo de unidades
    //    y detectar los errores gruesos (edades que no corresponden al paciente).
    // La unidad sale de TC_CATALOGO_PADRE.DESCRIPCION, que guarda el código homologado
    // (1=años, 2=meses, 3=días, 4=horas, 5=semanas); sin unidad reconocible la edad no es
    // verificable y la notificación se reporta como no válida.
    const query = `
        with esavi_inicio as (
          select tde."NOTIFICACION_ID" as noti_id, min(tde."FECHA_ESAVI") as fecha_inicio
          from "DHI_ESAVI"."TR_DATOS_ESAVI" tde
          where tde."FECHA_ESAVI" is not null
          group by tde."NOTIFICACION_ID"
        ),
        base as (
          select tn."ID" as id, tn."EDAD" as edad, cu."DESCRIPCION" as unidad,
                 tp."FECHA_NACIMIENTO" as fecha_nacimiento, ei.fecha_inicio
          from "DHI_ESAVI"."TR_NOTIFICACION" tn
          inner join "DHI_ESAVI"."TR_PACIENTE" tp on tp."ID" = tn."PACIENTE_ID"
          inner join esavi_inicio ei on ei.noti_id = tn."ID"
          left join "DHI_ESAVI"."TC_CATALOGO_PADRE" cu on cu."ID" = tn."CTUNIDADEDAD_ID"
          where tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
            and tn."EDAD" is not null
            and tp."FECHA_NACIMIENTO" is not null
        ),
        calc as (
          select id,
            case unidad
              when '1' then edad::numeric
              when '2' then edad::numeric / 12
              when '3' then edad::numeric / 365.25
              when '4' then edad::numeric / 8760
              when '5' then edad::numeric / 52.1429
              else null
            end as edad_registrada,
            (fecha_inicio::date - fecha_nacimiento::date)::numeric / 365.25 as edad_esperada
          from base
        ),
        evaluado as (
          select id,
            (edad_registrada is not null and abs(edad_registrada - edad_esperada) <= 1) as es_valido
          from calc
        )
        select
        count(*) as "totalRegistros",
        count(*) filter (where es_valido) as "totalRegistrosValidos",
        count(*) filter (where not es_valido) as "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT id) filter (where not es_valido), '[]') as "idNotificacionesNoValidos"
        from evaluado
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
    // Valida que el código ATC registrado corresponda a una vacuna (prefijo J07)
    const query = `
    select
    count(tdv."CODIGO_ATC") filter (where tdv."CODIGO_ATC" is not null) as "totalRegistros",
    count(tdv."CODIGO_ATC") filter (where tdv."CODIGO_ATC" like 'J07%') "totalRegistrosValidos",
    count(tdv."CODIGO_ATC") filter (where tdv."CODIGO_ATC" not like 'J07%') "totalRegistrosNoValidos",
    coalesce(json_agg(DISTINCT tdvn."NOTIFICACION_ID") filter (where tdv."CODIGO_ATC" not like 'J07%'), '[]') as "idNotificacionesNoValidos"
    from
      "DHI_ESAVI"."TR_DATO_VACUNA" tdv
    inner join "DHI_ESAVI"."TR_DATO_VACUNACION" tdvn on tdvn."ID" = tdv."DATO_VACUNACION_ID"
    inner join "DHI_ESAVI"."TR_NOTIFICACION" tn on tn."ID" = tdvn."NOTIFICACION_ID"
    where tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
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
      // El dominio de AUTOPSIA es 0=no, 1=sí, 2=no sabe (ver DesenlaceEsavi.autopsia); el
      // rango anterior (4..4) no coincidía con ningún valor que los integradores escriban,
      // así que marcaba como inválido el 100% de los registros.
      { tabla: 'TR_DESENLACE_ESAVI', campo: 'AUTOPSIA', minValor: 0, maxValor: 2 },
    ];
    const resultados: CalidadDatosResultadoDto[] = [];
    for (const item of tablasYCampos) {
      const { from, idNotificacion, fechaNotificacion } = DataQualityUtils.origenNotificacion(item.tabla, 'tn');
      const query = `
        select
        count(tn."${item.campo}") as "totalRegistros",
        count(tn."${item.campo}") filter (where tn."${item.campo}" between ${item.minValor} and ${
        item.maxValor
      }) "totalRegistrosValidos",
        count(tn."${item.campo}") filter (where tn."${item.campo}" < ${item.minValor} or tn."${item.campo}" > ${
        item.maxValor
      }) "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT ${idNotificacion}) filter (where tn."${item.campo}" < ${item.minValor} or tn."${
        item.campo
      }" > ${item.maxValor}), '[]') as "idNotificacionesNoValidos"
        from
          ${from}
        where ${fechaNotificacion} <= '${day.toISOString()}'
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
