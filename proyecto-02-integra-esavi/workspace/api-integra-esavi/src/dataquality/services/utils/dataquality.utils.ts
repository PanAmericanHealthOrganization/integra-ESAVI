import { CalidadDatosResultadoDto, TotalesCalidDatosDto } from 'src/dataquality/controllers/dto';

/**
 *
 */
export class DataQualityUtils {
  /**
   * Tablas evaluadas por las reglas que llegan a la notificación por su propia FK.
   */
  private static readonly TABLAS_CON_FK_NOTIFICACION = [
    'TR_DESENLACE_ESAVI',
    'TR_ESAVI_DURANTE_EMBARAZO',
    'TR_DATO_VACUNACION',
    'TR_DATOS_ESAVI',
  ];

  /**
   * Devuelve el origen SQL de una regla junto con la expresión del id de notificación.
   *
   * `GeneralService.qualityProblems` resuelve `idNotificacionesNoValidos` contra
   * TR_NOTIFICACION, así que una regla debe agregar el id de la notificación y no el PK de
   * la tabla que evalúa: si agrega el suyo, el detalle sale vacío aunque la regla haya
   * contado registros inválidos.
   *
   * TR_PACIENTE es el único origen sin FK hacia la notificación —se llega por el lado
   * inverso, TR_NOTIFICACION.PACIENTE_ID—, de modo que sus reglas quedan contadas por
   * notificación y no por paciente. Es el mismo criterio que ya usaba la dimensión de
   * completitud y el que corresponde a un módulo cuyos totales son de notificaciones.
   *
   * `fechaNotificacion` da además la ventana temporal de la regla. Filtrar por
   * AUD_FECHA_CREACION no sirve: esa columna guarda cuándo el integrador insertó la fila
   * —CURRENT_TIMESTAMP por defecto—, y como la carga es retroactiva siempre es muy
   * posterior al hecho, así que al evaluar un mes pasado descarta todas las filas y la
   * regla reporta cero registros.
   *
   * @param tabla tabla que evalúa la regla
   * @param alias alias que la regla usa para esa tabla
   */
  static origenNotificacion(
    tabla: string,
    alias: string,
  ): { from: string; idNotificacion: string; fechaNotificacion: string } {
    if (tabla === 'TR_NOTIFICACION') {
      return {
        from: `"DHI_ESAVI"."TR_NOTIFICACION" ${alias}`,
        idNotificacion: `${alias}."ID"`,
        fechaNotificacion: `${alias}."FECHA_NOTIFICACION"`,
      };
    }

    if (tabla === 'TR_PACIENTE') {
      return {
        from:
          `"DHI_ESAVI"."TR_PACIENTE" ${alias}` +
          ` inner join "DHI_ESAVI"."TR_NOTIFICACION" ${alias}_noti on ${alias}_noti."PACIENTE_ID" = ${alias}."ID"`,
        idNotificacion: `${alias}_noti."ID"`,
        fechaNotificacion: `${alias}_noti."FECHA_NOTIFICACION"`,
      };
    }

    if (DataQualityUtils.TABLAS_CON_FK_NOTIFICACION.includes(tabla)) {
      return {
        // El join es N:1, así que no multiplica filas ni altera los conteos de la regla.
        from:
          `"DHI_ESAVI"."${tabla}" ${alias}` +
          ` inner join "DHI_ESAVI"."TR_NOTIFICACION" ${alias}_noti on ${alias}_noti."ID" = ${alias}."NOTIFICACION_ID"`,
        idNotificacion: `${alias}."NOTIFICACION_ID"`,
        fechaNotificacion: `${alias}_noti."FECHA_NOTIFICACION"`,
      };
    }

    // Falla ruidosamente: una tabla sin ruta conocida hacia la notificación produciría
    // justamente el detalle vacío que este helper existe para evitar.
    throw new Error(`No se conoce la ruta de ${tabla} hacia TR_NOTIFICACION`);
  }

  /**
   * CTE `fechas` con **una fila por notificación** y las cuatro fechas que las reglas de
   * integridad cronológica comparan entre sí.
   *
   * Unir TR_DATOS_ESAVI y TR_DATO_VACUNACION directamente multiplica filas —una notificación
   * con 3 eventos y 2 vacunas se contaba 6 veces y pesaba 6 veces en el indicador—, así que
   * ambas llegan agregadas por subconsulta. Se toma la fecha más temprana de cada una: el
   * inicio del evento y la primera vacunación registrada, que son los extremos que definen la
   * secuencia clínica. Si el criterio del MSP fuera otro (por ejemplo la última dosis previa
   * al evento), se cambia aquí y aplica a las cuatro reglas a la vez.
   *
   * El orden cronológico que las reglas verifican es:
   * NACIMIENTO ≤ VACUNACIÓN ≤ ESAVI ≤ NOTIFICACIÓN.
   */
  static cteFechasNotificacion(day: Date): string {
    return `
      with fechas as (
        select
          tn."ID" as id,
          tn."FECHA_NOTIFICACION" as f_notificacion,
          tp."FECHA_NACIMIENTO" as f_nacimiento,
          (select min(ev."FECHA_ESAVI") from "DHI_ESAVI"."TR_DATOS_ESAVI" ev
             where ev."NOTIFICACION_ID" = tn."ID") as f_esavi,
          (select min(vac."FECHA_VACUNACION") from "DHI_ESAVI"."TR_DATO_VACUNACION" vac
             where vac."NOTIFICACION_ID" = tn."ID") as f_vacunacion
        from "DHI_ESAVI"."TR_NOTIFICACION" tn
        inner join "DHI_ESAVI"."TR_PACIENTE" tp on tp."ID" = tn."PACIENTE_ID"
        where tn."FECHA_NOTIFICACION" <= '${day.toISOString()}'
      )`;
  }

  /**
   * Cuerpo común de las reglas de integridad cronológica: cuenta sobre la CTE `fechas` las
   * notificaciones que cumplen `condicionValida` y lista las que no.
   *
   * Sólo entran las notificaciones con las cuatro fechas presentes, de modo que la condición
   * nunca evalúa a NULL y válidos + inválidos siempre suman el total.
   */
  static selectIntegridadFechas(condicionValida: string): string {
    return `
      select
        count(*) as "totalRegistros",
        count(*) filter (where ${condicionValida}) as "totalRegistrosValidos",
        count(*) filter (where not (${condicionValida})) as "totalRegistrosNoValidos",
        coalesce(json_agg(DISTINCT id) filter (where not (${condicionValida})), '[]') as "idNotificacionesNoValidos"
      from fechas
      where f_notificacion is not null
        and f_nacimiento is not null
        and f_esavi is not null
        and f_vacunacion is not null
      ;`;
  }

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
        porcentajeRegistrosValidos: 100,
        porcentajeRegistrosInvalidos: 0,
        idNotificacionesNoValidos: [],
      };
    }
    const row = result[0] || {};
    const totalRegistros = Math.trunc(Number(row.totalRegistros) || 0);
    const totalRegistrosValidos = Math.trunc(Number(row.totalRegistrosValidos) || 0);
    const totalRegistrosInvalidos = Math.trunc(Number(row.totalRegistrosNoValidos) || 0);
    const idNotificacionesNoValidos = Array.isArray(row.idNotificacionesNoValidos) ? row.idNotificacionesNoValidos : [];

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

  static calcularDeltaCalidad(
    resultados: CalidadDatosResultadoDto[],
    resultadosPrevios: CalidadDatosResultadoDto[],
  ): number {
    if (!resultados || resultados.length === 0) {
      return 0;
    }

    const calidadActual = DataQualityUtils.calcularCalidadDimension(resultados);
    const calidadPrevio = DataQualityUtils.calcularCalidadDimension(resultadosPrevios);

    return calidadActual - calidadPrevio;
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
