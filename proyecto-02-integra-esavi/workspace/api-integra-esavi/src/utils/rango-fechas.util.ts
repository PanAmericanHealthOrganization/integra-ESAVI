/**
 * Utilidades de rangos de fechas para los procesos programados (crons) de importación.
 * Es abstracta para impedir su instanciación: todos los métodos son estáticos y puros,
 * por lo que pueden usarse y probarse de forma aislada.
 */
export abstract class RangoFechasUtils {
  /**
   * Devuelve el rango completo del día anterior en UTC: desde las 00:00:00.000 hasta las
   * 23:59:59.999. Es el rango que consumen los crons diarios de VigiFlow y DHIS2, que se
   * ejecutan de noche y deben procesar únicamente los datos del día ya cerrado.
   *
   * El cambio de mes y de año lo resuelve Date.UTC(): un día 0 se interpreta como el último
   * día del mes anterior.
   *
   * @param referencia Fecha desde la que se calcula el día anterior (por defecto, ahora).
   */
  static diaAnterior(referencia: Date = new Date()): { fechaInicio: Date; fechaFin: Date } {
    const anio = referencia.getUTCFullYear();
    const mes = referencia.getUTCMonth();
    const diaAnterior = referencia.getUTCDate() - 1;

    return {
      fechaInicio: new Date(Date.UTC(anio, mes, diaAnterior, 0, 0, 0, 0)),
      fechaFin: new Date(Date.UTC(anio, mes, diaAnterior, 23, 59, 59, 999)),
    };
  }

  /**
   * Parte un rango de fechas en sub-rangos que no cruzan el límite de un mes calendario.
   * Un rango contenido en un solo mes se devuelve intacto (un único elemento), así que el
   * llamador puede iterar siempre sin distinguir casos.
   *
   * Los extremos originales se respetan: el primer sub-rango arranca en `fechaInicio` y el
   * último termina en `fechaFin`; los cortes intermedios van del día 1 a las 00:00:00.000
   * hasta el último día del mes a las 23:59:59.999. Todo se calcula en UTC, igual que
   * `diaAnterior` y que el formateo YYYYMMDD que consume VigiFlow.
   *
   * Motivo: VigiFlow degrada (o rechaza) las consultas de rangos largos, de modo que una
   * importación de varios meses se ejecuta como una serie de importaciones mensuales.
   *
   * Si el rango está invertido (`fechaFin` < `fechaInicio`) se devuelve tal cual, en un solo
   * elemento: validar el rango es responsabilidad del llamador.
   */
  static dividirEnMeses(fechaInicio: Date, fechaFin: Date): { fechaInicio: Date; fechaFin: Date }[] {
    if (fechaFin < fechaInicio) {
      return [{ fechaInicio, fechaFin }];
    }

    const rangos: { fechaInicio: Date; fechaFin: Date }[] = [];
    let inicioTramo = fechaInicio;

    while (inicioTramo <= fechaFin) {
      // Día 0 del mes siguiente = último día del mes en curso.
      const finDeMes = new Date(
        Date.UTC(inicioTramo.getUTCFullYear(), inicioTramo.getUTCMonth() + 1, 0, 23, 59, 59, 999),
      );
      const finTramo = finDeMes < fechaFin ? finDeMes : fechaFin;
      rangos.push({ fechaInicio: inicioTramo, fechaFin: finTramo });

      if (finTramo >= fechaFin) break;

      inicioTramo = new Date(
        Date.UTC(inicioTramo.getUTCFullYear(), inicioTramo.getUTCMonth() + 1, 1, 0, 0, 0, 0),
      );
    }

    return rangos;
  }

  /**
   * Interpreta una fecha `YYYY-MM-DD` como medianoche **local**, no UTC.
   *
   * `new Date('2026-08-01')` la interpretaría como medianoche UTC, que en Ecuador (UTC-5)
   * cae el 31 de julio a las 19:00 y desplazaría un día entero cada fecha del rango. Los
   * datos simulados de vacunación se guardan con la fecha local del día que representan,
   * así que el parseo tiene que ser local.
   *
   * @returns La fecha, o `null` si el valor está vacío, mal formado o no existe en el
   *          calendario (por ejemplo `2026-02-30`). Validar y reportar el error es
   *          responsabilidad del llamador.
   */
  static parsearFechaLocal(valor?: string): Date | null {
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec((valor ?? '').trim());
    if (!coincidencia) return null;

    const [, anio, mes, dia] = coincidencia.map(Number);
    const fecha = new Date(anio, mes - 1, dia, 0, 0, 0, 0);

    // Date normaliza los desbordes (31 de febrero pasa a marzo): si los componentes no
    // sobreviven el viaje de ida y vuelta, la fecha no existía.
    const esReal =
      fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;

    return esReal ? fecha : null;
  }

  /**
   * Enumera un día por cada jornada del rango, ambos extremos incluidos, a medianoche local.
   *
   * Avanza por componentes de calendario (`new Date(anio, mes, dia + i)`) en lugar de sumar
   * 86 400 000 ms, para que un eventual cambio de horario de verano no corra la hora ni
   * duplique o pierda un día.
   *
   * Un rango invertido (`fechaFin` < `fechaInicio`) devuelve un arreglo vacío.
   */
  static enumerarDiasLocales(fechaInicio: Date, fechaFin: Date): Date[] {
    const dias: Date[] = [];
    const anio = fechaInicio.getFullYear();
    const mes = fechaInicio.getMonth();
    const primerDia = fechaInicio.getDate();

    for (let i = 0; ; i++) {
      const dia = new Date(anio, mes, primerDia + i, 0, 0, 0, 0);
      if (dia > fechaFin) break;
      dias.push(dia);
    }

    return dias;
  }
}
