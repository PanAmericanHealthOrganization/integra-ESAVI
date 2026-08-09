import { differenceInCalendarDays } from "date-fns"

/**
 * Utilidades para tratar las fechas de los formularios como fechas de calendario,
 * sin zona horaria. Es abstracta para impedir su instanciación: todos los métodos son
 * estáticos y puros.
 *
 * Motivo: `<DateInput>` de react-admin entrega el valor como string `"YYYY-MM-DD"` una vez
 * que el usuario toca el campo, pero conserva el `Date` original si no lo toca. Y
 * `new Date("2026-08-01")` se interpreta como medianoche **UTC**, que en Ecuador (UTC-5)
 * cae el 31 de julio: convertir así el valor del formulario corre un día toda la fecha.
 */
export abstract class FechaUtils {
  /**
   * Normaliza a `"YYYY-MM-DD"` un valor de formulario, venga como string ya en ese formato
   * o como `Date`. Los `Date` se leen por componentes locales, nunca vía `toISOString()`.
   *
   * @returns La fecha normalizada, o cadena vacía si el valor no es utilizable.
   */
  static aFechaIso(valor: unknown): string {
    if (typeof valor === "string") {
      // Ya viene en el formato esperado desde el <input type="date">.
      if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor
      // Cualquier otro string (ISO completo, fecha localizada) se resuelve vía Date.
      return FechaUtils.aFechaIso(new Date(valor))
    }

    const fecha = valor instanceof Date ? valor : null
    if (!fecha || isNaN(fecha.getTime())) return ""

    const anio = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, "0")
    const dia = String(fecha.getDate()).padStart(2, "0")
    return `${anio}-${mes}-${dia}`
  }

  /**
   * Convierte un valor de formulario en un `Date` a medianoche **local**, sin el
   * desplazamiento que introduce el parseo UTC de `new Date("YYYY-MM-DD")`.
   *
   * @returns El `Date`, o `null` si el valor no es una fecha utilizable.
   */
  static aFechaLocal(valor: unknown): Date | null {
    const iso = FechaUtils.aFechaIso(valor)
    if (!iso) return null

    const [anio, mes, dia] = iso.split("-").map(Number)
    return new Date(anio, mes - 1, dia, 0, 0, 0, 0)
  }

  /**
   * Cantidad de días que abarca un rango contando ambos extremos: un mismo día es 1.
   * Devuelve 0 si alguno de los extremos no es una fecha utilizable.
   */
  static diasDelRango(desde: unknown, hasta: unknown): number {
    const inicio = FechaUtils.aFechaLocal(desde)
    const fin = FechaUtils.aFechaLocal(hasta)
    if (!inicio || !fin) return 0

    return differenceInCalendarDays(fin, inicio) + 1
  }
}
