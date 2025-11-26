import { Logger } from '@nestjs/common';
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

  private readonly logger = new Logger(DimConsistenciaService.name);

  /**
   *
   * @param day
   * @returns
   */
  async processAll(day: Date): Promise<DimensionCalidadDatosDto> {
    this.logger.log(`Iniciando procesamiento de Dimensión de Consistencia para el día ${day.toISOString()}`);
    const [
      edadInicioEvento,
      fechaNacimientoMinima,
      edadMinimaPosible,
      notificacionEnviada,
      integridadEsavi,
      integridadVacunaAndFechaVacunacion,
      integridadFechaNacimiento,
      integridadFechaVacunacion,
      integridadFechaESAVI,
      integridadFechaNotificacion,
      integridadFechaDeMuerte,
      integridadGravedadEsavi,
      integridadCasosFatales,
      integridadGestante,
    ] = await Promise.all([
      this._noFechasFuturas(day),
      this._fechaNacimientoMinima(day),
      this._edadMinimaPosible(day),
      this._notificacionEnviada(day),
      this._integridadEsavi(day),
      this._integridadVacunaAndFechaVacunacion(day),
      this._integridadFechaNacimiento(day),
      this._integridadFechaVacunacion(day),
      this._integridadFechaESAVI(day),
      this._integridadFechaNotificacion(day),
      this._integridadFechaDeMuerte(day),
      this._integridadGravedadEsavi(day),
      this._integridadCasosFatales(day),
      this._integridadGestante(day),
    ]);
    return {
      dimension: 'Dimensión de Exactitud',
      calidadDimension: DataQualityUtils.calcularCalidadDimension([
        ...edadInicioEvento,
        fechaNacimientoMinima,
        edadMinimaPosible,
        notificacionEnviada,
        integridadEsavi,
        integridadVacunaAndFechaVacunacion,
        integridadFechaNacimiento,
        integridadFechaVacunacion,
        integridadFechaESAVI,
        integridadFechaNotificacion,
        integridadFechaDeMuerte,
        integridadGravedadEsavi,
        integridadCasosFatales,
        integridadGestante,
      ]),
      jsonQuality: [
        ...edadInicioEvento,
        fechaNacimientoMinima,
        edadMinimaPosible,
        notificacionEnviada,
        integridadEsavi,
        integridadVacunaAndFechaVacunacion,
        integridadFechaNacimiento,
        integridadFechaVacunacion,
        integridadFechaESAVI,
        integridadFechaNotificacion,
        integridadFechaDeMuerte,
        integridadGravedadEsavi,
        integridadCasosFatales,
        integridadGestante,
      ],
    };
  }

  /**
   * Calidad edad al inicio del evento
   * @param day
   * @returns
   */
  private async _noFechasFuturas(day: Date): Promise<CalidadDatosResultadoDto[]> {
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
          codigo: 'CON_DOM_001',
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
    this.logger.log(`Iniciando evaluación de fecha de nacimiento mínima para el día ${day.toISOString()}`);
    const query = `
      select
      count(*) as "totalRegistros",
      count(*) filter (
        where extract(year from age(tn."FECHA_NOTIFICACION", tp."FECHA_NACIMIENTO")) < 120
      ) as "totalRegistrosValidos",
      count(*) filter (
        where extract(year from age(tn."FECHA_NOTIFICACION", tp."FECHA_NACIMIENTO")) >= 120
      ) as "totalRegistrosNoValidos",
      coalesce(
        json_agg(DISTINCT tn."ID") filter (
        where extract(year from age(tn."FECHA_NOTIFICACION", tp."FECHA_NACIMIENTO")) >= 120
        ), '[]'
      ) as "idNotificacionesNoValidos"
      from
      dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_PACIENTE" tp on tp."ID" = tn."PACIENTE_ID"
      where
      tn."FECHA_NOTIFICACION" is not null
      and tp."FECHA_NACIMIENTO" is not null
      and tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);
    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_02',
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
    this.logger.log(`Iniciando evaluación de edad mínima posible para el día ${day.toISOString()}`);
    const query = `
      select
      count(*) as "totalRegistros",
      count(*) filter (where tn."EDAD" >= 0) as "totalRegistrosValidos",
      count(*) filter (where tn."EDAD" < 0) as "totalRegistrosNoValidos",
      coalesce(json_agg(DISTINCT tn."ID") filter (where tn."EDAD" < 0), '[]') as "idNotificacionesNoValidos"
      from 
      dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_PACIENTE" tp on tp."ID" = tn."PACIENTE_ID"
      where
      tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);
    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_03',
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
    this.logger.log(`Iniciando evaluación de notificación enviada para el día ${day.toISOString()}`);
    const query = `
      select
      count(*) as "totalRegistros",
      count(*) filter (where tn."FECHA_NOTIFICACION" is not null) as "totalRegistrosValidos",
      count(*) filter (where tn."FECHA_NOTIFICACION" is null) as "totalRegistrosNoValidos",
      coalesce(json_agg(DISTINCT tn."ID") filter (where tn."FECHA_NOTIFICACION" is null), '[]') as "idNotificacionesNoValidos"
      from 
      dhi_esavi."TR_NOTIFICACION" tn
      where
      tn."FECHA_NOTIFICACION" is not null
      and
      tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);

    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_04',
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
    this.logger.log(`Iniciando evaluación de integridad ESAVI para el día ${day.toISOString()}`);
    const query = `
      select
      count(*) as "totalRegistros",
      count(*) filter (where tde."NAME_LLT" is not null) as "totalRegistrosValidos",
      count(*) filter (where tde."NAME_LLT" is null) as "totalRegistrosNoValidos",
      coalesce(json_agg(DISTINCT tn."ID") filter (where tde."NAME_LLT" is null), '[]') as "idNotificacionesNoValidos"
      from
      dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_DATOS_ESAVI" tde on
      tde."NOTIFICACION_ID" = tn."ID"
      where
      tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);
    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_05',
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
  private async _integridadVacunaAndFechaVacunacion(day: Date): Promise<CalidadDatosResultadoDto> {
    this.logger.log(`Iniciando evaluación de integridad Vacuna y Fecha de Vacunación para el día ${day.toISOString()}`);
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
        or tdv."NOMBRE_VACUNA" is null) as "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT tn."ID") filter (where tdvn."FECHA_VACUNACION" is null or tdv."NOMBRE_VACUNA" is null), '[]') as "idNotificacionesNoValidos"
      from
        dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_DATO_VACUNACION" tdvn on
        tdvn."NOTIFICACION_ID" = tn."ID"
      inner join dhi_esavi."TR_DATO_VACUNA" tdv on
        tdv."NOTIFICACION_ID" = tn."ID"
      where
      tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);
    const totale = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_06',
      tipo: 'Interrelación',
      regla: 'El registro de una vacuna debe ir asociado al registro de la fecha de administración de la vacuna',
      condicion:
        'Si ID tiene un registro válido, entonces FECHA_VACUNACION debe contener al menos un valor registrado.',
      descripcionRegla: 'El valor es correcto cuando se cumple la fórmula',
      ...totale,
    };
  }

  /**
   *
   * @param day
   * @returns
   */
  private async _integridadFechaNacimiento(day: Date): Promise<CalidadDatosResultadoDto> {
    this.logger.log(`Iniciando evaluación de integridad Fecha de Nacimiento para el día ${day.toISOString()}`);
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
        ) as "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT tn."ID") filter (where tp."FECHA_NACIMIENTO" >= tdv."FECHA_VACUNACION" or tp."FECHA_NACIMIENTO" >= tde."FECHA_ESAVI" or tp."FECHA_NACIMIENTO" >= tn."FECHA_NOTIFICACION"), '[]') as "idNotificacionesNoValidos"
      from
        dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_PACIENTE" tp on
        tn."PACIENTE_ID"= tp."ID" 
      inner join dhi_esavi."TR_DATOS_ESAVI" tde on
        tde."NOTIFICACION_ID" = tn."ID"
      inner join dhi_esavi."TR_DATO_VACUNACION" tdv on
        tdv."NOTIFICACION_ID" = tn."ID"
      where
        tn."FECHA_NOTIFICACION" is not null
        and tp."FECHA_NACIMIENTO" is not null
        and tde."FECHA_ESAVI" is not null
        and tdv."FECHA_VACUNACION" is not null
        and tp."FECHA_NACIMIENTO" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);

    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_002',
      tipo: 'Dimensión de Integridad',
      regla: 'Integridad FECHA_NACIMIENTO (solo para casos en los que FECHA_NACIMIENTO es distinto de null)',
      condicion:
        'El valor es correcto si las 3 formulas se cumplen y no se encuentran valores en los que FECHA_NACIMIENTO sea > a una o más de las otras fechas.',
      descripcionRegla: 'La fecha de nacimiento se debe relacionar en forma logica con otras variables de tipo fecha',
      ...totales,
    };
  }

  /**
   *
   * @param day
   * @returns
   */
  private async _integridadFechaVacunacion(day: Date): Promise<CalidadDatosResultadoDto> {
    this.logger.log(`Iniciando evaluación de integridad Fecha de Vacunación para el día ${day.toISOString()}`);
    const query = `
      select
        count(*) as "totalRegistros",
        count(*) filter (
          where
             tdv."FECHA_VACUNACION" >= tp."FECHA_NACIMIENTO" AND 
             tdv."FECHA_VACUNACION" <= tde."FECHA_ESAVI" AND
              tdv."FECHA_VACUNACION" <= tn."FECHA_NOTIFICACION"
        ) as "totalRegistrosValidos",
        count(*) filter (
          where
             tdv."FECHA_VACUNACION" < tp."FECHA_NACIMIENTO" OR 
             tdv."FECHA_VACUNACION" > tde."FECHA_ESAVI" OR
              tdv."FECHA_VACUNACION" > tn."FECHA_NOTIFICACION"
        ) as "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT tn."ID") filter (where tdv."FECHA_VACUNACION" < tp."FECHA_NACIMIENTO" or tdv."FECHA_VACUNACION" > tde."FECHA_ESAVI" or tdv."FECHA_VACUNACION" > tn."FECHA_NOTIFICACION"), '[]') as "idNotificacionesNoValidos"
      from
        dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_PACIENTE" tp on
        tn."PACIENTE_ID" = tp."ID" 
      inner join dhi_esavi."TR_DATOS_ESAVI" tde on
        tde."NOTIFICACION_ID" = tn."ID"
      inner join dhi_esavi."TR_DATO_VACUNACION" tdv on
        tdv."NOTIFICACION_ID" = tn."ID"
      where
        tn."FECHA_NOTIFICACION" is not null
        and tp."FECHA_NACIMIENTO" is not null
        and tde."FECHA_ESAVI" is not null
        and tdv."FECHA_VACUNACION" is not null
        and tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_002',
      tipo: 'Interrelación',
      regla: 'Integridad FECHA_VACUNACION (solo para casos en los que FECHA_VACUNACION es distinto de null)',
      condicion:
        'El valor es correcto si las 3 formulas se cumplen y no se encuentran valores en los que FECHA_VACUNACION sea > a una o más de las otras fechas.',
      descripcionRegla: 'La fecha de vacunación se debe relacionar en forma logica con otras variables de tipo fecha',
      ...totales,
    };
  }

  /**
   *
   * @param day
   * @returns
   */
  private async _integridadFechaESAVI(day: Date): Promise<CalidadDatosResultadoDto> {
    this.logger.log(`Iniciando evaluación de integridad Fecha de ESAVI para el día ${day.toISOString()}`);
    const query = `
      select
        count(*) as "totalRegistros",
        count(*) filter (
          where
             tde."FECHA_ESAVI" >= tp."FECHA_NACIMIENTO" AND 
              tde."FECHA_ESAVI" <= tdv."FECHA_VACUNACION" AND
              tde."FECHA_ESAVI" <= tn."FECHA_NOTIFICACION"
        ) as "totalRegistrosValidos",
        count(*) filter (
          where
              tde."FECHA_ESAVI" < tp."FECHA_NACIMIENTO" OR
              tde."FECHA_ESAVI" > tdv."FECHA_VACUNACION" OR
              tde."FECHA_ESAVI" > tn."FECHA_NOTIFICACION"
        ) as "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT tn."ID") filter (where tde."FECHA_ESAVI" < tp."FECHA_NACIMIENTO" or tde."FECHA_ESAVI" > tdv."FECHA_VACUNACION" or tde."FECHA_ESAVI" > tn."FECHA_NOTIFICACION"), '[]') as "idNotificacionesNoValidos"
      from
        dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_PACIENTE" tp on
        tp."ID" = tn."PACIENTE_ID"
      inner join dhi_esavi."TR_DATOS_ESAVI" tde on
        tde."NOTIFICACION_ID" = tn."ID"
      inner join dhi_esavi."TR_DATO_VACUNACION" tdv on
        tdv."NOTIFICACION_ID" = tn."ID"
      where
        tn."FECHA_NOTIFICACION" is not null
        and tp."FECHA_NACIMIENTO" is not null
        and tde."FECHA_ESAVI" is not null
        and tdv."FECHA_VACUNACION" is not null
        and tn."FECHA_NOTIFICACION"<= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_002',
      tipo: 'Interrelación',
      regla: 'Integridad FECHA_ESAVI (solo para casos en los que FECHA_ESAVI es distinto de null)',
      condicion: `1. FECHA_ESAVI  es ≥  FECHA_NACIMIENTO 
         2. FECHA_ESAVI  es ≥  FECHA_VACUNACION
         3. FECHA_ESAVI es ≤ FECHA_NOTIFICACION`,
      descripcionRegla: 'La fecha de ESAVI se debe relacionar en forma logica con otras variables de tipo fecha',
      ...totales,
    };
  }

  /**
   * Genera la ingridad en función de la fecha de notificación
   * @param day
   * @returns
   */
  private async _integridadFechaNotificacion(day: Date): Promise<CalidadDatosResultadoDto> {
    this.logger.log(`Iniciando evaluación de integridad Fecha de Notificación para el día ${day.toISOString()}`);
    const query = `
      select
      count(*) as "totalRegistros",
      count(*) filter (
      where
        tn."FECHA_NOTIFICACION" >= tp."FECHA_NACIMIENTO" AND
        tn."FECHA_NOTIFICACION" <= tdv."FECHA_VACUNACION" AND
        tn."FECHA_NOTIFICACION" >= tde."FECHA_ESAVI"
      ) as "totalRegistrosValidos",
      count(*) filter (
      where
        tn."FECHA_NOTIFICACION" < tp."FECHA_NACIMIENTO" OR
        tn."FECHA_NOTIFICACION" > tdv."FECHA_VACUNACION" OR
        tn."FECHA_NOTIFICACION" < tde."FECHA_ESAVI"
      ) as "totalRegistrosNoValidos",
      coalesce(
      json_agg(DISTINCT tn."ID") filter (
      where
        tn."FECHA_NOTIFICACION" < tp."FECHA_NACIMIENTO" OR
        tn."FECHA_NOTIFICACION" > tdv."FECHA_VACUNACION" OR
        tn."FECHA_NOTIFICACION" < tde."FECHA_ESAVI"
      ), '[]'
      ) as "idNotificacionesNoValidos"
      from
      dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_PACIENTE" tp on
      tp."ID" = tn."PACIENTE_ID"
      inner join dhi_esavi."TR_DATOS_ESAVI" tde on
      tde."NOTIFICACION_ID" = tn."ID"
      inner join dhi_esavi."TR_DATO_VACUNACION" tdv on
      tdv."NOTIFICACION_ID" = tn."ID"
      where
      tn."FECHA_NOTIFICACION" is not null
      and tp."FECHA_NACIMIENTO" is not null
      and tde."FECHA_ESAVI" is not null
      and tdv."FECHA_VACUNACION" is not null
      and tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_002',
      tipo: 'Interrelación',
      regla: 'Integridad FECHA_NOTIFICACION\n(solo para casos en los que FECHA_NOTIFICACION es distinto de null)',
      condicion: `1.  FECHA_NOTIFICACION ≥ FECHA_NACIMIENTO
                  2. FECHA_NOTIFICACION ≥  FECHA_VACUNACION
                  3. FECHA_NOTIFICACION ≥  FECHA_ESAVI
                `,
      descripcionRegla:
        'La fecha de NOTIFICACION  se debe relacionar en forma logica con otras variables de tipo fecha',
      ...totales,
    };
  }

  /**
   *
   * @param day
   * @returns
   */
  private async _integridadFechaDeMuerte(day: Date): Promise<CalidadDatosResultadoDto> {
    this.logger.log(`Iniciando evaluación de integridad Fecha de Muerte para el día ${day.toISOString()}`);
    const query = `
      select
        count(*) filter (where tge."MUERTE" = true) as "totalRegistros",
        count(*) filter (
          where
            tde."FECHAMUERTE" is not null
            and tde."FECHAMUERTE" >= tp."FECHA_NACIMIENTO"
            and tde."FECHAMUERTE" <= tn."FECHA_NOTIFICACION"
            and tde."FECHAMUERTE" >= tdv."FECHA_VACUNACION"
            and tde."FECHAMUERTE" >= tde2."FECHA_ESAVI"
        ) as "totalRegistrosValidos",
        count(*) filter (
          where
            tde."FECHAMUERTE" is null
            or tde."FECHAMUERTE" < tp."FECHA_NACIMIENTO"
            or tde."FECHAMUERTE" > tn."FECHA_NOTIFICACION"
            or tde."FECHAMUERTE" < tdv."FECHA_VACUNACION"
            or tde."FECHAMUERTE" < tde2."FECHA_ESAVI"
        ) as "totalRegistrosNoValidos"
      , coalesce(json_agg(DISTINCT tn."ID") filter (
          where
            tde."FECHAMUERTE" is null
            or tde."FECHAMUERTE" < tp."FECHA_NACIMIENTO"
            or tde."FECHAMUERTE" > tn."FECHA_NOTIFICACION"
            or tde."FECHAMUERTE" < tdv."FECHA_VACUNACION"
            or tde."FECHAMUERTE" < tde2."FECHA_ESAVI"
        ), '[]') as "idNotificacionesNoValidos"
      from
        dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_PACIENTE" tp on
        tp."ID" = tn."PACIENTE_ID"
      inner join dhi_esavi."TR_DESENLACE_ESAVI" tde on
        tde."NOTIFICACION_ID" = tn."ID"
      inner join dhi_esavi."TR_DATO_VACUNACION" tdv on
        tdv."NOTIFICACION_ID" = tn."ID"
      left join dhi_esavi."TR_DATOS_ESAVI" tde2 on
        tde2."NOTIFICACION_ID" = tn."ID"
      inner join dhi_esavi."TR_GRAVEDAD_ESAVI" tge on
        tge."NOTIFICACION_ID" = tn."ID"
      where
        tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
    ;`;

    const result = await this.dataSource.query(query);
    const totales = await DataQualityUtils.construirResultado(result);

    return {
      codigo: 'CON_DOM_002',
      tipo: 'Interrelación',
      regla: 'Integridad Fecha de Muerte (casos fatales)',
      condicion: `Si MUERTE = true entonces <b>FECHAMUERTE</b> debe existir y cumplir:
        - FECHAMUERTE >= FECHA_NACIMIENTO
        - FECHAMUERTE <= FECHA_NOTIFICACION
        - FECHAMUERTE >= FECHA_VACUNACION
        - FECHAMUERTE >= FECHA_ESAVI`,
      descripcionRegla:
        'En casos con desenlace fatal, la fecha de muerte debe ser coherente respecto a las demás fechas relacionadas.',
      ...totales,
    };
  }

  /**
   *
   * @param date
   * @returns
   */
  private async _integridadGravedadEsavi(date: Date): Promise<CalidadDatosResultadoDto> {
    this.logger.log(`Iniciando evaluación de integridad Gravedad ESAVI para el día ${date.toISOString()}`);
    const query = `
       select
      count(*) as "totalRegistros",
      count(*) filter (
        where
        (tde."TIPO_GRAVEDAD" = 'GRAVE' and 
        (
          tde."MUERTE" = true OR
          tde."RIESGO_VIDA" = true OR
          tde."DISCAPACIDAD" = true OR
          tde."HOSPITALIZACION" = true OR
          tde."ANOMALIA_CONGENITA" = true OR
          tde."ABORTO" = true OR
          tde."MUERTE_FETAL" = true OR
          tde."OTROS_EVENTOS_IMPORTANTES" = true
        ))
        OR
        (tde."TIPO_GRAVEDAD" != 'GRAVE')
      ) as "totalRegistrosValidos",
      count(*) filter (
        where
        (tde."TIPO_GRAVEDAD" = 'GRAVE' and  
        (
          tde."MUERTE" = false AND
          tde."RIESGO_VIDA" = false AND
          tde."DISCAPACIDAD" = false AND
          tde."HOSPITALIZACION" = false AND
          tde."ANOMALIA_CONGENITA" = false AND
          tde."ABORTO" = false AND
          tde."MUERTE_FETAL" = false AND
          tde."OTROS_EVENTOS_IMPORTANTES" = false
        ))
      ) as "totalRegistrosNoValidos"
      , coalesce(json_agg(DISTINCT tn."ID") filter (
        where
        (tde."TIPO_GRAVEDAD" = 'GRAVE' and  
        (
          tde."MUERTE" = false AND
          tde."RIESGO_VIDA" = false AND
          tde."DISCAPACIDAD" = false AND
          tde."HOSPITALIZACION" = false AND
          tde."ANOMALIA_CONGENITA" = false AND
          tde."ABORTO" = false AND
          tde."MUERTE_FETAL" = false AND
          tde."OTROS_EVENTOS_IMPORTANTES" = false
        ))
      ), '[]') as "idNotificacionesNoValidos"
      
      from
      dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_GRAVEDAD_ESAVI" tde on
      tde."NOTIFICACION_ID" = tn."ID"
      where
      tn."FECHA_NOTIFICACION" <= '${date.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);

    const totales = await DataQualityUtils.construirResultado(result);

    return {
      codigo: 'CON_DOM_002',
      tipo: 'Interrelación',
      regla: 'Los ESAVI graves deben tener al menos un motivo de gravedad registrado',
      condicion: `
        1. Si TIPO_GRAVEDAD= GRAVE  entonces al menos una de las siguientes variables debe ser = true
          MUERTE
          RIESGO_VIDA
          DISCAPACIDAD
          HOSPITALIZACION
          ANOMALIA_CONGENITA
          ABORTO
          MUERTE_FETAL
          OTROS_EVENTOS_IMPORTANTES`,

      descripcionRegla:
        'La fecha de NOTIFICACION  se debe relacionar en forma logica con otras variables de tipo fecha',
      ...totales,
    };
  }

  /**
   *
   * @param day
   * @returns
   */
  private async _integridadCasosFatales(day: Date): Promise<CalidadDatosResultadoDto> {
    this.logger.log(`Iniciando evaluación de integridad Casos Fatales para el día ${day.toISOString()}`);
    const query = `
      select
        count(*) as "totalRegistros",
        count(*) filter (
          where
            tde2."FECHAMUERTE" is not null
            and tde."TIPO_GRAVEDAD" = 'GRAVE'
            and tde."MUERTE" = true
        ) as "totalRegistrosValidos",
        count(*) filter (
          where
            tde2."FECHAMUERTE" is not null
            and (
              tde."TIPO_GRAVEDAD" != 'GRAVE'
              or tde."MUERTE" = false
            )
        ) as "totalRegistrosNoValidos"
      , coalesce(json_agg(DISTINCT tn."ID") filter (
          where
            tde2."FECHAMUERTE" is not null
            and (
              tde."TIPO_GRAVEDAD" != 'GRAVE'
              or tde."MUERTE" = false
            )
        ), '[]') as "idNotificacionesNoValidos" 
      from
        dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_GRAVEDAD_ESAVI" tde on
        tde."NOTIFICACION_ID" = tn."ID"
      inner join dhi_esavi."TR_DESENLACE_ESAVI" tde2 on
        tde2."NOTIFICACION_ID" = tn."ID"
      where
        tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);

    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_003',
      tipo: 'Interrelación',
      regla: 'Integridad Casos Fatales',
      condicion: `1. Si FECHAMUERTE es distinto de null entonces: TIPO_GRAVEDAD debe ser = GRAVE
      MUERTE debe ser = true`,
      descripcionRegla:
        'Los casos de ESAVI con desenlace fatal tienen que tener coherencia en sus variable relacionadas',
      ...totales,
    };
  }

  private async _integridadGestante(day: Date): Promise<CalidadDatosResultadoDto> {
    const query = `
      select
        count(*) as "totalRegistros", 
        count(*) filter (
          where
            (tpe."EMBARAZADA_MOMENTO_VACUNA" = true OR tpe."EMBARAZADA_MOMENTO_ESAVI" = true)
            and upper(tc."DESCRIPCION_HOMOLOGADA") = 'MUJER'
        ) as "totalRegistrosValidos",
        count(*) filter (
          where
            (tpe."EMBARAZADA_MOMENTO_VACUNA" = true OR tpe."EMBARAZADA_MOMENTO_ESAVI" = true)
            and upper(tc."DESCRIPCION_HOMOLOGADA") != 'MUJER'
        ) as "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT tn."ID") filter (
          where
            (tpe."EMBARAZADA_MOMENTO_VACUNA" = true OR tpe."EMBARAZADA_MOMENTO_ESAVI" = true)
            and upper(tc."DESCRIPCION_HOMOLOGADA") != 'MUJER'
        ), '[]') as "idNotificacionesNoValidos"
      from
        dhi_esavi."TR_NOTIFICACION" tn
      inner join dhi_esavi."TR_PACIENTE" tp on
        tp."ID" = tn."PACIENTE_ID"
      inner join dhi_esavi."TR_PACIENTE_EMBARAZADA" tpe on
        tpe."NOTIFICACION_ID" = tn."ID"
      left join dhi_esavi."TC_CATALOGO" tc on
        tc."ID" = tp."CT_SEXO_ID"
      where
        tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
    ;`;

    const result = await this.dataSource.query(query);

    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_004',
      tipo: 'Interrelación',
      regla: 'Integridad Gestante',
      condicion: `1. Si "EMBARAZADA_MOMENTO_VACUNA" = true  y/o EMBARAZADA_MOMENTO_ESAVI= true entonces "CT_SEXO_ID" mujer`,
      descripcionRegla: 'Los ESAVI en gestantes deben tener una relación lógica con la variable sexo ',
      ...totales,
    };
  }
}
