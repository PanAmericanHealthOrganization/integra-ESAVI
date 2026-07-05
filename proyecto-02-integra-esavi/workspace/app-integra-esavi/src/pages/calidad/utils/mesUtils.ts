/**
 * Utilidades para manipular períodos año-mes en formato "YYYY-MM"
 * (el formato que usan los inputs type="month").
 */
export abstract class MesUtils {
  /** Mes actual en formato YYYY-MM */
  static mesActual(): string {
    return new Date().toISOString().slice(0, 7)
  }

  /** Mes mínimo consultable: 5 años hacia atrás desde hoy */
  static mesMinimo(): string {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 5)
    return date.toISOString().slice(0, 7)
  }

  /** Suma (o resta con delta negativo) meses a un período YYYY-MM */
  static sumarMeses(mes: string, delta: number): string {
    const [anio, mm] = mes.split("-").map(Number)
    const fecha = new Date(anio, mm - 1 + delta, 1)
    const nuevoMes = String(fecha.getMonth() + 1).padStart(2, "0")
    return `${fecha.getFullYear()}-${nuevoMes}`
  }

  /** Restringe un período YYYY-MM al rango [min, max] */
  static limitar(mes: string, min: string, max: string): string {
    if (mes < min) return min
    if (mes > max) return max
    return mes
  }
}
