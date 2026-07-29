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
}
