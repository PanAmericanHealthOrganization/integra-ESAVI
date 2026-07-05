/**
 * Clase utilitaria del integrador VigiFlow.
 * Es abstracta para impedir su instanciación: todos los métodos son estáticos y puros
 * (no dependen de servicios inyectados), por lo que pueden usarse y probarse de forma aislada.
 */
export abstract class VigiflowUtils {
  /**
   * Formatea una fecha como YYYYMMDD (UTC), formato requerido por los reportes de VigiFlow.
   * Ejm: 20230113
   */
  static formatoYYYYMMDD(fecha: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${fecha.getUTCFullYear()}${pad(fecha.getUTCMonth() + 1)}${pad(fecha.getUTCDate())}`;
  }

  /**
   * Convierte una cadena con formato YYYYMMDD (exactamente 8 dígitos) en una fecha UTC.
   * Retorna null si la cadena no cumple el formato o la fecha es inválida.
   */
  static analizarCadenaFecha(dateStr?: string): Date | null {
    if (!dateStr || !/^\d{8}$/.test(dateStr)) {
      return null;
    }
    const year = Number(dateStr.slice(0, 4));
    const month = Number(dateStr.slice(4, 6));
    const day = Number(dateStr.slice(6, 8));
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  }

  /**
   * Convierte una cadena YYYYMMDD o YYYYMM en una fecha UTC.
   * Cuando la fecha solo tiene YYYYMM (sin día), se usa el 15 como día por defecto.
   * Retorna null si el valor es vacío, demasiado corto o inválido.
   */
  static formatoFecha(valor?: string): Date | null {
    if (valor && valor.length >= 6) {
      const year = parseInt(valor.substring(0, 4), 10);
      const month = parseInt(valor.substring(4, 6), 10);
      const dayStr = valor.substring(6, 8);
      const day = dayStr ? (parseInt(dayStr, 10) || 15) : 15;
      const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  /** Convierte el valor a entero; retorna 0 si no es un número válido. */
  static formatoInteger(valor: string): number {
    let resultado = 0;
    try {
      resultado = parseInt(valor);
      if (isNaN(resultado)) {
        resultado = 0;
      }
    } catch (error) {}
    return resultado;
  }

  /** Convierte el valor a decimal; retorna 0 si no es un número válido. */
  static formatoFloat(valor: string): number {
    let resultado = 0;
    try {
      resultado = parseFloat(valor);
      if (isNaN(resultado)) {
        resultado = 0;
      }
    } catch (error) {}
    return resultado;
  }

  /** Divide una celda multilínea en un arreglo de líneas limpias (sin vacías). */
  static splitLineas(valor: string): string[] {
    if (!valor) return [];
    return valor.split(/\r?\n/).map(s => s.trim()).filter(s => s !== '');
  }

  /** Elimina todos los saltos de línea de la cadena. */
  static eliminarSaltoLinea(cadena: string): string {
    return cadena.replace(/[\r\n]+/g, '');
  }

  /** Elimina los acentos/tildes de la cadena; retorna undefined si el valor no es una cadena. */
  static eliminarTildes(str?: string): string | undefined {
    try {
      return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
    } catch (error) {}
  }

  /** Elimina acentos y convierte todo a minúsculas. */
  static normalizarTexto(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  /** Devuelve el primer fragmento de la cadena, hasta encontrar un salto de línea, tabulador o coma. */
  static obtenerPrimerComentario(cadena: string): string {
    return cadena ? cadena.split(/\r?\n|\r|\t|,/)[0] : '';
  }

  /** Busca en la lista el primer elemento que contenga la entrada (comparación sin tildes ni mayúsculas). */
  static encontrarCoincidencia(entrada: string, lista: string[]): string | undefined {
    const entradaNormalizada = VigiflowUtils.normalizarTexto(entrada);
    return lista.find((item) => VigiflowUtils.normalizarTexto(item).includes(entradaNormalizada));
  }

  /** Retorna true para 'si', false para 'no' y null para cualquier otro valor. */
  static esAfirmativo(valor: unknown): boolean | null {
    const val = (valor || '').toString().trim().toLowerCase();
    return val === 'si' ? true : val === 'no' ? false : null;
  }

  /**
   * Normaliza el número de lote de la vacuna según una lista de palabras/frases clave.
   * Si coincide con alguna de ellas, devuelve "Desconocido"; caso contrario, el valor original.
   */
  static transformarLoteVacuna(valor: string): string {
    if (!valor) return valor;

    const palabrasClave = [
      'SE DESCONOCE EL LOTE',
      'SE DESCONOCE',
      'DESCONOCE',
      'DESCONOCIDO',
      'N/R',
      'Ni idea',
      'no aplica',
      'no reporta',
      'NO SE DISPONE',
      'NO DISPONIBLE',
      'NO REGISTRA',
      'Asked But Unknown',
      'NO INDICA',
    ];

    // Construcción dinámica de la expresión regular
    const regex = new RegExp(
      `(^|\\s)(${palabrasClave.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(\\s|$)`,
      'i',
    );

    return regex.test(valor.trim()) ? 'Desconocido' : valor;
  }

  /**
   * Convierte una cadena separada por punto y coma en un arreglo JSON
   * con la estructura [{ ingredient: "..." }, ...]
   * - Divide la cadena por punto y coma ';'
   * - Limpia espacios y posibles caracteres de retorno de carro '\r' alrededor de cada término
   * - Descarta términos vacíos resultantes de divisiones consecutivas o espacios
   */
  static parseIngredientsWithSemicolonsToJson(rawText?: string): { ingredient: string }[] {
    if (!rawText || typeof rawText !== 'string') {
      return [];
    }

    return rawText
      .split(';')
      .map(termino => termino.trim())
      .filter(termino => termino !== '')
      .map(termino => ({ ingredient: termino }));
  }

  /**
   * Extrae de una celda (posiblemente multilínea) el primer código ATC de vacuna válido:
   * empieza con "J07" y tiene una longitud máxima de 7 caracteres.
   */
  static extraerCodigoAtcVacuna(celda: string): string | null {
    if (!celda) return null;

    for (const elemento of celda.split(/\r?\n/)) {
      const valor = elemento.trim();
      if (valor.startsWith('J07') && valor.length <= 7) {
        return valor;
      }
    }

    return null;
  }

  /**
   * Limpia una cadena de patente/principio activo WHODrug:
   * - Elimina espacios al inicio y al final
   * - Reemplaza saltos de línea internos por punto y coma
   * - Elimina saltos de línea al final de la cadena
   * - Elimina espacios antes y después del punto y coma
   * No se reemplazan las comas por punto y coma porque en varios nombres de patente WHODrug
   * la coma es parte del nombre oficial, ejm: "Hexasiil - Vacuna Conjugada (Adsorbida)
   * Antidiftérica, Antitetánica y Contra la Tosferina...".
   */
  static limpiarCampoWHODrug(input?: string): string {
    if (!input) return '';

    return input
      .trim()
      .replace(/[\r\n]+(?!$)/g, ';')
      .replace(/[\r\n]+$/g, '')
      .replace(/\s*;\s*/g, ';');
  }

  /** Pausa la ejecución por la cantidad de milisegundos indicada. */
  static sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
