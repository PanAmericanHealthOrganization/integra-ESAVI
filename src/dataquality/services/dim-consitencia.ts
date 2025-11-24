import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CalidadDatosResultadoDto, DimensionCalidadDatosDto } from '../controllers/dto/quality.dto';
import { DataQualityUtils } from './utils/dataquality.utils';

/**
 *
 */
export class DimConsistenciaService {
  /**
   *
   * @param dataSource
   */
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
    const [
      edadInicioEvaento,
      fechaNacimientoMinima,
      edadMinimaPosible,
      notificacionEnviada,
      integridadEsavi,
      integridadVacunaFechaVacunacion,
    ] = await Promise.all([
      this._noFechasFuturas(day),
      this._fechaNacimientoMinima(day),
      this._edadMinimaPosible(day),
      this._notificacionEnviada(day),
      this._integridadEsavi(day),
      this._integridadVacunaFechaVacunacion(day),
    ]);
    return {
      dimension: 'Dimensión de Exactitud',
      calidadDimension: DataQualityUtils.calcularCalidadDimension([
        ...edadInicioEvaento,
        fechaNacimientoMinima,
        edadMinimaPosible,
        notificacionEnviada,
        integridadEsavi,
        integridadVacunaFechaVacunacion,
      ]),
      jsonQuality: [
        ...edadInicioEvaento,
        fechaNacimientoMinima,
        edadMinimaPosible,
        notificacionEnviada,
        integridadEsavi,
        integridadVacunaFechaVacunacion,
      ],
    };
  }

  /**
   * Calidad edad al inicio del evento
   * @param day
   * @returns
   */
  private async _noFechasFuturas(day: Date): Promise<CalidadDatosResultadoDto[]> {
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
      for (const columna of evalItem.columnas) {
        const query = `
        select
        count(tp."${columna}") filter (where tp."${columna}" is not null) as "totalRegistros",
        count(tp."${columna}") filter (where tp."${columna}" <= tp."AUD_FECHA_CREACION") "totalRegistrosValidos",
        count(tp."${columna}") filter (where tp."${columna}" > tp."AUD_FECHA_CREACION") "totalRegistrosNoValidos"
        from
          dhi_esavi."${evalItem.tabla}" tp
        where tp."AUD_FECHA_CREACION" <= '${day.toISOString()}';`;
        const result = await this.dataSource.query(query);
        //
        const totales = await DataQualityUtils.construirResultado(result);
        resultados.push({
          tipo: 'Dominio',
          regla: `No fechas futuras en ${evalItem.tabla}.${columna}`,
          condicion: `La columna ${columna} en la tabla ${evalItem.tabla} no debe contener fechas posteriores a la fecha de evaluación.`,
          descripcionRegla: `El valor es correcto cuando la fecha registrada en ${columna} es anterior o igual a la fecha de evaluación.`,
          ...totales,
        });
      }
    }
    return resultados;
  }

  /**
   *
   * @param day
   * @returns
   */
  private async _fechaNacimientoMinima(day: Date): Promise<CalidadDatosResultadoDto> {
    const query = `
      select
      count(*) as "totalRegistros",
      count(*) filter (where extract(year from age(tn."FECHA_NOTIFICACION", tp."FECHA_NACIMIENTO")) < 120) as "totalRegistrosValidos",
      count(*) filter (where extract(year from age(tn."FECHA_NOTIFICACION", tp."FECHA_NACIMIENTO")) >= 120) as "totalRegistrosNoValidos"
      from
      dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_PACIENTE" tp on tp."PACIENTE_ID" = tn."PACIENTE_ID"
      where
      tn."FECHA_NOTIFICACION" is not null
      and tp."FECHA_NACIMIENTO" is not null
      and tp."AUD_FECHA_CREACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);
    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      tipo: 'Dominio',
      regla: 'Fecha de nacimiento mínima posible',
      condicion:
        'La fecha de nacimiento registrada no debe ser anterior a 120 años desde la fecha de creación del registro.',
      descripcionRegla:
        'El valor es correcto cuando la fecha de nacimiento es al menos 120 años menor que la fecha de creación del registro.',
      ...totales,
    };
  }

  /**
   *
   * @param day
   * @returns
   */
  private async _edadMinimaPosible(day: Date): Promise<CalidadDatosResultadoDto> {
    const query = `
      select
      count(*) as "totalRegistros",
      count(*) filter (where tn."EDAD" >= 0) as "totalRegistrosValidos",
      count(*) filter (where tn."EDAD" < 0) as "totalRegistrosNoValidos"
      from 
      dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_PACIENTE" tp on tp."PACIENTE_ID" = tn."PACIENTE_ID"
      where
      tn."AUD_FECHA_CREACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);
    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      tipo: 'Dominio',
      regla: 'Edad mínima posible',
      condicion: 'La edad registrada no debe ser un valor negativo.',
      descripcionRegla: 'El valor es correcto cuando la edad es mayor o igual a cero.',
      ...totales,
    };
  }

  /**
   *
   * @param day
   * @returns
   */
  private async _notificacionEnviada(day: Date): Promise<CalidadDatosResultadoDto> {
    const query = `
      select
      count(*) as "totalRegistros",
      count(*) filter (where tn."FECHA_NOTIFICACION" is not null) as "totalRegistrosValidos",
      count(*) filter (where tn."FECHA_NOTIFICACION" is null) as "totalRegistrosNoValidos"
      from 
      dhi_esavi."TR_NOTIFICACION" tn
      where
      tn."FECHA_NOTIFICACION" is not null
      and
      tn."AUD_FECHA_CREACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);

    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      tipo: 'Dominio',
      regla: 'Notificación enviada',
      condicion: 'La fecha de notificación debe estar registrada.',
      descripcionRegla: 'El valor es correcto cuando la fecha de notificación no es nula.',
      ...totales,
    };
  }

  /**
   *
   * @param day
   * @returns
   */
  private async _integridadEsavi(day: Date): Promise<CalidadDatosResultadoDto> {
    const query = `
      select
      count(*) as "totalRegistros",
      count(*) filter (where tde."NAME_LLT" is not null) as "totalRegistrosValidos",
      count(*) filter (where tde."NAME_LLT" is null) as "totalRegistrosNoValidos"
      from
      dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_DATOS_ESAVI" tde on
      tde."NOTIFICACION_ID" = tn."ID"
      where
      tn."AUD_FECHA_CREACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);
    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      tipo: 'Dimensión de Integridad',
      regla: 'Integridad Esavi - Nombre LLT',
      condicion: 'Si ID tiene un registro válido, entonces NAME_LLT debe contener al menos un valor registrado.',
      descripcionRegla: 'El valor es correcto cuando se cumple la fórmula',
      ...totales,
    };
  }

  /**
   *
   * @param day
   * @returns
   */
  private async _integridadVacunaFechaVacunacion(day: Date): Promise<CalidadDatosResultadoDto> {
    const query = `
      select
        count(*) as "totalRegistros",
        count(*) filter (
        where
        tdvn."FECHA_VACUNACION" is not null
        and tdv."NOMBRE_VACUNA" is not null) as "totalRegistrosValidos",
        count(*) filter (
        where
        tdvn."FECHA_VACUNACION" is null
        or tdv."NOMBRE_VACUNA" is null) as "totalRegistrosNoValidos"
      from
        dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_DATO_VACUNACION" tdvn on
        tdvn."NOTIFICACION_ID" = tn."ID"
      inner join dhi_esavi."TR_DATO_VACUNA" tdv on
        tdv."NOTIFICACION_ID" = tn."ID"
      where
      tn."AUD_FECHA_CREACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);
    const totale = await DataQualityUtils.construirResultado(result);
    return {
      tipo: 'Dimensión de Integridad',
      regla: 'El registro de una vacuna debe ir asociado al registro de la fecha de administración de la vacuna',
      condicion:
        'Si ID tiene un registro válido, entonces FECHA_VACUNACION debe contener al menos un valor registrado.',
      descripcionRegla: 'El valor es correcto cuando se cumple la fórmula',
      ...totale,
    };
  }
  async integridadFechaNacimiento(day: Date): Promise<CalidadDatosResultadoDto> {
    const query = `
      select
        count(*) as "totalRegistros",
        count(*) filter (
          where
            tp."FECHA_NACIMIENTO" < tdv."FECHA_VACUNACION"
            and tp."FECHA_NACIMIENTO" < tde."FECHA_ESAVI"
            and tp."FECHA_NACIMIENTO" < tn."FECHA_NOTIFICACION"
        ) as "totalRegistrosValidos",
        count(*) filter (
          where
            tp."FECHA_NACIMIENTO" >= tdv."FECHA_VACUNACION"
            or tp."FECHA_NACIMIENTO" >= tde."FECHA_ESAVI"
            or tp."FECHA_NACIMIENTO" >= tn."FECHA_NOTIFICACION"
        ) as "totalRegistrosNoValidos"
      from
        dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_PACIENTE" tp on
        tp."PACIENTE_ID" = tn."PACIENTE_ID"
      inner join dhi_esavi."TR_DATOS_ESAVI" tde on
        tde."NOTIFICACION_ID" = tn."ID"
      inner join dhi_esavi."TR_DATO_VACUNACION" tdv on
        tdv."NOTIFICACION_ID" = tn."ID"
      where
        tn."FECHA_NOTIFICACION" is not null
        and tp."FECHA_NACIMIENTO" is not null
        and tde."FECHA_ESAVI" is not null
        and tdv."FECHA_VACUNACION" is not null
        and tp."AUD_FECHA_CREACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);

    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      tipo: 'Dimensión de Integridad',
      regla: 'La fecha de nacimiento se debe relacionar en forma logica con otras variables de tipo fecha',
      condicion:
        'El valor es correcto si las 3 formulas se cumplen y no se encuentran valores en los que FECHA_NACIMIENTO sea > a una o más de las otras fechas.',
      descripcionRegla: 'La fecha de nacimiento se debe relacionar en forma logica con otras variables de tipo fecha',
      ...totales,
    };
  }
}
