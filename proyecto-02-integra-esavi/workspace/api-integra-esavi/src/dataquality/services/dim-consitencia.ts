import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CalidadDatosResultadoDto,
  DIMENSION_CALIDAD,
  DimensionCalidadDatosDto,
  SUB_DIMENSION_CALIDAD,
} from '../controllers/dto';
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

  /** La notificación tiene al menos un ESAVI con término MedDRA homologado. */
  private readonly EXISTE_ESAVI = `exists (
    select 1 from "DHI_ESAVI"."TR_DATOS_ESAVI" e
    where e."NOTIFICACION_ID" = tn."ID" and e."NOMBRE_ESAVI" is not null
  )`;

  /** La notificación tiene al menos una vacuna con fecha de administración y código ATC. */
  private readonly EXISTE_VACUNA_COMPLETA = `exists (
    select 1
    from "DHI_ESAVI"."TR_DATO_VACUNACION" dv
    inner join "DHI_ESAVI"."TR_DATO_VACUNA" v on v."DATO_VACUNACION_ID" = dv."ID"
    where dv."NOTIFICACION_ID" = tn."ID"
      and dv."FECHA_VACUNACION" is not null
      and v."CODIGO_ATC" is not null
  )`;

  /**
   *
   * @param day
   * @returns
   */
  async processAll(day: Date): Promise<DimensionCalidadDatosDto> {
    this.logger.log(`Iniciando procesamiento de Dimensión de Consistencia para el día ${day.toISOString()}`);
    const [
      noFechasFuturas,
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
    // del mes anterior
    //TODO: MEJORAR la generacion
    const previousMonth = new Date(day);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const [
      noFechasFuturasPrevious,
      fechaNacimientoMinimaPrevious,
      edadMinimaPosiblePrevious,
      notificacionEnviadaPrevious,
      integridadEsaviPrevious,
      integridadVacunaAndFechaVacunacionPrevious,
      integridadFechaNacimientoPrevious,
      integridadFechaVacunacionPrevious,
      integridadFechaESAVIPrevious,
      integridadFechaNotificacionPrevious,
      integridadFechaDeMuertePrevious,
      integridadGravedadEsaviPrevious,
      integridadCasosFatalesPrevious,
      integridadGestantePrevious,
    ] = await Promise.all([
      this._noFechasFuturas(previousMonth),
      this._fechaNacimientoMinima(previousMonth),
      this._edadMinimaPosible(previousMonth),
      this._notificacionEnviada(previousMonth),
      this._integridadEsavi(previousMonth),
      this._integridadVacunaAndFechaVacunacion(previousMonth),
      this._integridadFechaNacimiento(previousMonth),
      this._integridadFechaVacunacion(previousMonth),
      this._integridadFechaESAVI(previousMonth),
      this._integridadFechaNotificacion(previousMonth),
      this._integridadFechaDeMuerte(previousMonth),
      this._integridadGravedadEsavi(previousMonth),
      this._integridadCasosFatales(previousMonth),
      this._integridadGestante(previousMonth),
    ]);
    return {
      dimension: DIMENSION_CALIDAD.CONSISTENCIA,
      calidadTotal: DataQualityUtils.calcularCalidadDimension([
        ...noFechasFuturas,
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
      deltaCalidadTotal: DataQualityUtils.calcularDeltaCalidad(
        [
          ...noFechasFuturas,
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
        [
          ...noFechasFuturasPrevious,
          fechaNacimientoMinimaPrevious,
          edadMinimaPosiblePrevious,
          notificacionEnviadaPrevious,
          integridadEsaviPrevious,
          integridadVacunaAndFechaVacunacionPrevious,
          integridadFechaNacimientoPrevious,
          integridadFechaVacunacionPrevious,
          integridadFechaESAVIPrevious,
          integridadFechaNotificacionPrevious,
          integridadFechaDeMuertePrevious,
          integridadGravedadEsaviPrevious,
          integridadCasosFatalesPrevious,
          integridadGestantePrevious,
        ],
      ),
      jsonDimensionQuality: [
        ...noFechasFuturas,
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
    ];
    const resultados = [];
    for (const evalItem of evaluacion) {
      // Antes había aquí un mapa de tablas a su columna ID que devolvía 'ID' para todas: el
      // detalle terminaba con el PK de la tabla evaluada y quedaba vacío al resolverse
      // contra TR_NOTIFICACION.
      const { from, idNotificacion, fechaNotificacion } = DataQualityUtils.origenNotificacion(evalItem.tabla, 'tp');
      for (const columna of evalItem.columnas) {
        const query = `
        select
        count(tp."${columna}") filter (where tp."${columna}" is not null) as "totalRegistros",
        count(tp."${columna}") filter (where tp."${columna}" <= tp."AUD_FECHA_CREACION") "totalRegistrosValidos",
        count(tp."${columna}") filter (where tp."${columna}" > tp."AUD_FECHA_CREACION") "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT ${idNotificacion}) filter (where tp."${columna}" > tp."AUD_FECHA_CREACION"), '[]') as "idNotificacionesNoValidos"
        from
          ${from}
        where ${fechaNotificacion} <= '${day.toISOString()}';`;
        const result = await this.dataSource.query(query);
        //
        const totales = await DataQualityUtils.construirResultado(result);
        resultados.push({
          codigo: `CON_DOM_001_${(columna || '').toUpperCase()}`,
          subDimension: SUB_DIMENSION_CALIDAD.CONS_DOMINIO,
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
      "DHI_ESAVI"."TR_NOTIFICACION" tn
      inner join "DHI_ESAVI"."TR_PACIENTE" tp on tp."ID" = tn."PACIENTE_ID"
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
      subDimension: SUB_DIMENSION_CALIDAD.CONS_DOMINIO,
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
      "DHI_ESAVI"."TR_NOTIFICACION" tn
      inner join "DHI_ESAVI"."TR_PACIENTE" tp on tp."ID" = tn."PACIENTE_ID"
      where
      tn."EDAD" is not null AND
      tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);
    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_03',
      subDimension: SUB_DIMENSION_CALIDAD.CONS_DOMINIO,
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
    // La regla busca notificaciones sin fecha de notificación, pero el WHERE exigía que esa
    // fecha existiera: se anulaba a sí misma y siempre daba 100%. Como la ventana del periodo
    // también se apoya en esa fecha, para las que no la tienen se cae a la fecha de carga;
    // es el único caso del módulo donde AUD_FECHA_CREACION es el criterio correcto, porque
    // sin fecha del hecho no hay otra forma de ubicar la notificación en el tiempo.
    const query = `
      select
      count(*) as "totalRegistros",
      count(*) filter (where tn."FECHA_NOTIFICACION" is not null) as "totalRegistrosValidos",
      count(*) filter (where tn."FECHA_NOTIFICACION" is null) as "totalRegistrosNoValidos",
      coalesce(json_agg(DISTINCT tn."ID") filter (where tn."FECHA_NOTIFICACION" is null), '[]') as "idNotificacionesNoValidos"
      from 
      "DHI_ESAVI"."TR_NOTIFICACION" tn
      where
      coalesce(tn."FECHA_NOTIFICACION", tn."AUD_FECHA_CREACION") <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);

    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_INTRA_OO1',
      subDimension: SUB_DIMENSION_CALIDAD.CONS_INTRARELACION,
      regla: 'Notificación enviada',
      condicion: 'La fecha de notificación debe estar registrada.',
      descripcionRegla: 'El valor es correcto cuando la fecha de notificación no es nula.',
      ...totales,
    };
  }

  /**
   * @param day
   * @returns
   */
  private async _integridadEsavi(day: Date): Promise<CalidadDatosResultadoDto> {
    this.logger.log(`Iniciando evaluación de integridad ESAVI para el día ${day.toISOString()}`);
    // Con INNER JOIN a TR_DATOS_ESAVI, una notificación sin ningún evento registrado quedaba
    // fuera del conjunto evaluado: la regla no podía detectar precisamente el caso que mide.
    // El EXISTS la mantiene dentro y además evita contar varias veces las que tienen más de
    // un ESAVI.
    const query = `
      select
      count(*) as "totalRegistros",
      count(*) filter (where ${this.EXISTE_ESAVI}) as "totalRegistrosValidos",
      count(*) filter (where not ${this.EXISTE_ESAVI}) as "totalRegistrosNoValidos",
      coalesce(json_agg(DISTINCT tn."ID") filter (where not ${this.EXISTE_ESAVI}), '[]') as "idNotificacionesNoValidos"
      from
      "DHI_ESAVI"."TR_NOTIFICACION" tn
      where
      tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);
    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_INTRA_OO2',
      subDimension: SUB_DIMENSION_CALIDAD.CONS_INTRARELACION,
      regla: 'Integridad ESAVI',
      condicion:
        'Si ID tiene un registro válido, entonces NAME_LLT debe contener al menos un término  MedDRA,El valor es correcto cuando se cumple la fórmula',
      descripcionRegla:
        'Si la notificación fue enviada debe existir al menos un signo, síntoma o hallazgo anormal de laboratorio reportado como ESAVI',
      ...totales,
    };
  }

  // _integridadLoteVacuna se retiró: su query era una cadena vacía y processAll nunca la
  // invocaba, así que la regla CON_INTRA_OO3 no llegó a existir en el reporte. Si se
  // reactiva, tiene que escribirse el SQL antes de sumarla a processAll.

  /**
   *
   * @param day
   * @returns
   */
  private async _integridadFechaNacimiento(day: Date): Promise<CalidadDatosResultadoDto> {
    this.logger.log(`Iniciando evaluación de integridad Fecha de Nacimiento para el día ${day.toISOString()}`);
    const query =
      DataQualityUtils.cteFechasNotificacion(day) +
      DataQualityUtils.selectIntegridadFechas(
        'f_nacimiento < f_vacunacion and f_nacimiento < f_esavi and f_nacimiento < f_notificacion',
      );
    const result = await this.dataSource.query(query);

    //
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_001',
      subDimension: SUB_DIMENSION_CALIDAD.CONS_DOMINIO,
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
  private async _integridadVacunaAndFechaVacunacion(day: Date): Promise<CalidadDatosResultadoDto> {
    this.logger.log(`Iniciando evaluación de integridad Vacuna y Fecha de Vacunación para el día ${day.toISOString()}`);
    // Igual que en _integridadEsavi: con INNER JOIN, una notificación sin ninguna vacuna
    // registrada desaparecía del conjunto en lugar de contarse como no válida.
    const query = `
      select
        count(*) as "totalRegistros",
        count(*) filter (where ${this.EXISTE_VACUNA_COMPLETA}) as "totalRegistrosValidos",
        count(*) filter (where not ${this.EXISTE_VACUNA_COMPLETA}) as "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT tn."ID") filter (where not ${this.EXISTE_VACUNA_COMPLETA}), '[]') as "idNotificacionesNoValidos"
      from
        "DHI_ESAVI"."TR_NOTIFICACION" tn
      where
      tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
      ;
    `;
    const result = await this.dataSource.query(query);
    const totale = await DataQualityUtils.construirResultado(result);
    return {
      // Antes 'CON_DOM_02', el mismo código que la regla de fecha de nacimiento mínima. Como
      // qualityProblems localiza la regla con un find() por código, la segunda quedaba
      // inalcanzable y su detalle nunca se podía consultar.
      codigo: 'CON_DOM_009',
      subDimension: SUB_DIMENSION_CALIDAD.CONS_INTERRELACION,
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
  private async _integridadFechaVacunacion(day: Date): Promise<CalidadDatosResultadoDto> {
    this.logger.log(`Iniciando evaluación de integridad Fecha de Vacunación para el día ${day.toISOString()}`);
    const query =
      DataQualityUtils.cteFechasNotificacion(day) +
      DataQualityUtils.selectIntegridadFechas(
        'f_vacunacion >= f_nacimiento and f_vacunacion <= f_esavi and f_vacunacion <= f_notificacion',
      );
    const result = await this.dataSource.query(query);
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_002',
      subDimension: SUB_DIMENSION_CALIDAD.CONS_DOMINIO,
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
    // El evento adverso ocurre DESPUÉS de la vacunación: la versión anterior exigía
    // FECHA_ESAVI <= FECHA_VACUNACION, contradiciendo la condición documentada abajo, y daba
    // por válidos justamente los casos cronológicamente imposibles.
    const query =
      DataQualityUtils.cteFechasNotificacion(day) +
      DataQualityUtils.selectIntegridadFechas(
        'f_esavi >= f_nacimiento and f_esavi >= f_vacunacion and f_esavi <= f_notificacion',
      );
    const result = await this.dataSource.query(query);
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_003',
      subDimension: SUB_DIMENSION_CALIDAD.CONS_DOMINIO,
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
    // Se notifica DESPUÉS de vacunar: antes se exigía FECHA_NOTIFICACION <= FECHA_VACUNACION,
    // al revés de la condición documentada abajo.
    const query =
      DataQualityUtils.cteFechasNotificacion(day) +
      DataQualityUtils.selectIntegridadFechas(
        'f_notificacion >= f_nacimiento and f_notificacion >= f_vacunacion and f_notificacion >= f_esavi',
      );
    const result = await this.dataSource.query(query);
    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_004',
      subDimension: SUB_DIMENSION_CALIDAD.CONS_INTERRELACION,
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
    // Las banderas de gravedad (MUERTE, RIESGO_VIDA, etc.) son varchar en la BD:
    // el integrador DHIS2 guarda '1'/'0' y el de Vigiflow 'true'/'false'.
    //
    // La regla sólo aplica a los casos fatales, así que las tres cifras y el detalle parten
    // del mismo universo. Antes no era así: los válidos no filtraban por MUERTE y el detalle
    // omitía ese filtro, de modo que listaba muchas más notificaciones de las que el propio
    // contador de inválidos reportaba. Las fechas de evento y vacunación llegan agregadas por
    // subconsulta para no multiplicar filas.
    const query = `
      with casos as (
        select
          tn."ID" as id,
          tn."FECHA_NOTIFICACION" as f_notificacion,
          tp."FECHA_NACIMIENTO" as f_nacimiento,
          tde."FECHAMUERTE" as f_muerte,
          (select min(ev."FECHA_ESAVI") from "DHI_ESAVI"."TR_DATOS_ESAVI" ev
             where ev."NOTIFICACION_ID" = tn."ID") as f_esavi,
          (select min(vac."FECHA_VACUNACION") from "DHI_ESAVI"."TR_DATO_VACUNACION" vac
             where vac."NOTIFICACION_ID" = tn."ID") as f_vacunacion
        from "DHI_ESAVI"."TR_NOTIFICACION" tn
        inner join "DHI_ESAVI"."TR_PACIENTE" tp on tp."ID" = tn."PACIENTE_ID"
        inner join "DHI_ESAVI"."TR_DESENLACE_ESAVI" tde on tde."NOTIFICACION_ID" = tn."ID"
        where tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
          and exists (
            select 1 from "DHI_ESAVI"."TR_GRAVEDAD_ESAVI" g
            where g."NOTIFICACION_ID" = tn."ID" and g."MUERTE" in ('1', 'true')
          )
      ),
      evaluado as (
        select id,
          coalesce(
            f_muerte is not null
            and f_muerte >= f_nacimiento
            and f_muerte <= f_notificacion
            and (f_vacunacion is null or f_muerte >= f_vacunacion)
            and (f_esavi is null or f_muerte >= f_esavi),
          false) as es_valido
        from casos
      )
      select
        count(*) as "totalRegistros",
        count(*) filter (where es_valido) as "totalRegistrosValidos",
        count(*) filter (where not es_valido) as "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT id) filter (where not es_valido), '[]') as "idNotificacionesNoValidos"
      from evaluado
    ;`;

    const result = await this.dataSource.query(query);
    const totales = await DataQualityUtils.construirResultado(result);

    return {
      codigo: 'CON_DOM_005',
      subDimension: SUB_DIMENSION_CALIDAD.CONS_INTERRELACION,
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
    // El universo son los ESAVI graves. Inválido es "no tiene ninguna bandera en verdadero",
    // no "las tiene todas en falso": con la formulación anterior un caso con alguna bandera
    // nula no caía ni en válidos ni en inválidos y el porcentaje se calculaba sobre un
    // denominador que no cuadraba con sus partes.
    const query = `
      with graves as (
        select tn."ID" as id,
          (
            tge."MUERTE" in ('1', 'true') or
            tge."RIESGO_VIDA" in ('1', 'true') or
            tge."DISCAPACIDAD" in ('1', 'true') or
            tge."HOSPITALIZACION" in ('1', 'true') or
            tge."ANOMALIA_CONGENITA" in ('1', 'true') or
            tge."ABORTO" in ('1', 'true') or
            tge."MUERTE_FETAL" in ('1', 'true')
          ) as tiene_motivo
        from "DHI_ESAVI"."TR_NOTIFICACION" tn
        inner join "DHI_ESAVI"."TR_GRAVEDAD_ESAVI" tge on tge."NOTIFICACION_ID" = tn."ID"
        where tn."FECHA_NOTIFICACION" <= '${date.toISOString()}'
          and tge."TIPO_GRAVEDAD" = 'GRAVE'
      ),
      evaluado as (
        select id, coalesce(tiene_motivo, false) as es_valido from graves
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

    const totales = await DataQualityUtils.construirResultado(result);

    return {
      codigo: 'CON_DOM_006',
      subDimension: SUB_DIMENSION_CALIDAD.CONS_INTERRELACION,
      regla: 'Los ESAVI graves deben tener al menos un motivo de gravedad registrado',
      condicion: `
        1. Si TIPO_GRAVEDAD= GRAVE  entonces al menos una de las siguientes variables debe ser = true
          MUERTE
          RIESGO_VIDA
          DISCAPACIDAD
          HOSPITALIZACION
          ANOMALIA_CONGENITA
          ABORTO
          MUERTE_FETAL`,

      descripcionRegla:
        'Un ESAVI clasificado como grave debe indicar al menos un motivo de gravedad que justifique esa clasificación.',
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
    // La regla sólo habla de notificaciones con FECHAMUERTE, así que ese es el denominador.
    // Antes el total era count(*) de todas las notificaciones mientras válidos e inválidos
    // sólo contaban las fatales, y el porcentaje resultante hundía la dimensión entera.
    const query = `
      with fatales as (
        select tn."ID" as id,
          exists (
            select 1 from "DHI_ESAVI"."TR_GRAVEDAD_ESAVI" g
            where g."NOTIFICACION_ID" = tn."ID"
              and g."TIPO_GRAVEDAD" = 'GRAVE'
              and g."MUERTE" in ('1', 'true')
          ) as es_valido
        from "DHI_ESAVI"."TR_NOTIFICACION" tn
        where tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
          and exists (
            select 1 from "DHI_ESAVI"."TR_DESENLACE_ESAVI" d
            where d."NOTIFICACION_ID" = tn."ID" and d."FECHAMUERTE" is not null
          )
      )
      select
        count(*) as "totalRegistros",
        count(*) filter (where es_valido) as "totalRegistrosValidos",
        count(*) filter (where not es_valido) as "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT id) filter (where not es_valido), '[]') as "idNotificacionesNoValidos"
      from fatales
      ;
    `;
    const result = await this.dataSource.query(query);

    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_007',
      subDimension: SUB_DIMENSION_CALIDAD.CONS_INTERRELACION,
      regla: 'Integridad Casos Fatales',
      condicion: `1. Si FECHAMUERTE es distinto de null entonces: TIPO_GRAVEDAD debe ser = GRAVE
      MUERTE debe ser = true`,
      descripcionRegla:
        'Los casos de ESAVI con desenlace fatal tienen que tener coherencia en sus variable relacionadas',
      ...totales,
    };
  }

  private async _integridadGestante(day: Date): Promise<CalidadDatosResultadoDto> {
    // El universo son las notificaciones con embarazo declarado, no todas. Y un embarazo con
    // sexo sin registrar tampoco es coherente: con la comparación anterior (`!= 'MUJER'`) el
    // sexo nulo daba NULL y el caso se perdía sin contarse en ninguna de las dos cifras.
    const query = `
      with gestantes as (
        select tn."ID" as id, coalesce(upper(tc."NOMBRE") = 'MUJER', false) as es_valido
        from "DHI_ESAVI"."TR_NOTIFICACION" tn
        inner join "DHI_ESAVI"."TR_PACIENTE" tp on tp."ID" = tn."PACIENTE_ID"
        left join "DHI_ESAVI"."TC_CATALOGO_PADRE" tc on tc."ID" = tp."CT_SEXO_ID"
        where tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
          and exists (
            select 1 from "DHI_ESAVI"."TR_ANTECEDENTES_EMBARAZO" e
            where e."NOTIFICACION_ID" = tn."ID"
              and (
                e."EMBARAZADA_MOMENTO_VACUNA" in ('1', 'true')
                or e."EMBARAZADA_MOMENTO_ESAVI" in ('1', 'true')
              )
          )
      )
      select
        count(*) as "totalRegistros",
        count(*) filter (where es_valido) as "totalRegistrosValidos",
        count(*) filter (where not es_valido) as "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT id) filter (where not es_valido), '[]') as "idNotificacionesNoValidos"
      from gestantes
    ;`;

    const result = await this.dataSource.query(query);

    const totales = await DataQualityUtils.construirResultado(result);
    return {
      codigo: 'CON_DOM_008',
      subDimension: SUB_DIMENSION_CALIDAD.CONS_INTERRELACION,
      regla: 'Integridad Gestante',
      condicion: `1. Si "EMBARAZADA_MOMENTO_VACUNA" = true  y/o EMBARAZADA_MOMENTO_ESAVI= true entonces "CT_SEXO_ID" mujer`,
      descripcionRegla: 'Los ESAVI en gestantes deben tener una relación lógica con la variable sexo ',
      ...totales,
    };
  }
}
