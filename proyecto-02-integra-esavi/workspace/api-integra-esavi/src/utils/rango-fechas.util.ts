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
}
