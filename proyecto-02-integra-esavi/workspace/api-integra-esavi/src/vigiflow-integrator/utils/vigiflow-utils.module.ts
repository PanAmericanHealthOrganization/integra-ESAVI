/** Rango válido de semanas de gestación acordado con el personal funcional. */
const EDAD_GESTACIONAL_MINIMA_SEMANAS = 1;
const EDAD_GESTACIONAL_MAXIMA_SEMANAS = 43;

/** Días que tiene una semana; usado en los cálculos obstétricos. */
const DIAS_POR_SEMANA = 7;

/** Duración estándar de una gestación a término, acordada con el personal funcional. */
const SEMANAS_GESTACION_A_TERMINO = 40;

/**
 * Códigos homologados del estado final del evento (RESULTADO_EVENTO).
 * El orden numérico representa la severidad: a mayor código, mayor severidad.
 */
export enum ResultadoEvento {
  DESCONOCIDO = 0,
  RECUPERADO = 1,
  EN_RECUPERACION = 2,
  NO_RECUPERADO = 3,
  RECUPERADO_CON_SECUELAS = 4,
  MUERTE = 5,
}

/**
 * Términos (normalizados: sin tildes y en minúsculas) que identifican cada estado final
 * en la columna "Resultado" de la hoja Reacciones. El orden importa: se evalúa de mayor
 * a menor especificidad para que "no recuperado" no sea capturado por "recuperado", ni
 * "recuperado con secuelas" por "recuperado".
 */
const TERMINOS_RESULTADO_EVENTO: { termino: string; codigo: ResultadoEvento }[] = [
  { termino: 'fatal', codigo: ResultadoEvento.MUERTE },
  { termino: 'muerte', codigo: ResultadoEvento.MUERTE },
  { termino: 'secuelas', codigo: ResultadoEvento.RECUPERADO_CON_SECUELAS },
  { termino: 'no recuperado', codigo: ResultadoEvento.NO_RECUPERADO },
  { termino: 'no resuelto', codigo: ResultadoEvento.NO_RECUPERADO },
  { termino: 'en recuperacion', codigo: ResultadoEvento.EN_RECUPERACION },
  { termino: 'resolviendose', codigo: ResultadoEvento.EN_RECUPERACION },
  { termino: 'recuperado', codigo: ResultadoEvento.RECUPERADO },
  { termino: 'resuelto', codigo: ResultadoEvento.RECUPERADO },
];

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
    } catch {}
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
    } catch {}
    return resultado;
  }

  /**
   * Convierte las semanas de gestación al momento de la exposición a un valor numérico
   * general (entero o flotante) mediante Number(). Solo se acepta el rango de 1 a 43
   * semanas (inclusive); cualquier otro valor —texto no numérico, celda vacía o fuera
   * de rango— se descarta devolviendo null para no persistir datos inválidos.
   */
  static formatoEdadGestacional(valor?: unknown): number | null {
    if (valor === null || valor === undefined || valor.toString().trim() === '') {
      return null;
    }

    const edadGestacional = Number(valor.toString().trim());
    if (!Number.isFinite(edadGestacional)) {
      return null;
    }

    return edadGestacional >= EDAD_GESTACIONAL_MINIMA_SEMANAS && edadGestacional <= EDAD_GESTACIONAL_MAXIMA_SEMANAS
      ? edadGestacional
      : null;
  }

  /**
   * Convierte el valor a número entero descartando separadores de miles y decimales
   * (puntos, comas y espacios). Ejm: "1.234" → 1234, "2,0" → 20, "3 dosis" → 3.
   * Retorna null si no queda ningún dígito.
   */
  static formatoEnteroSinSeparadores(valor?: unknown): number | null {
    if (valor === null || valor === undefined) return null;

    const digitos = valor.toString().replace(/[^\d]/g, '');
    if (digitos === '') return null;

    const entero = Number.parseInt(digitos, 10);
    return Number.isNaN(entero) ? null : entero;
  }

  /**
   * Calcula la fecha de última menstruación restando a la fecha del ESAVI (inicio de
   * síntomas) las semanas de gestación transcurridas.
   * FUM = fechaEsavi − (edadGestacional × 7 días)
   */
  static calcularFechaUltimaMenstruacion(fechaEsavi?: Date | null, edadGestacional?: number | null): Date | null {
    if (!fechaEsavi || edadGestacional === null || edadGestacional === undefined) {
      return null;
    }
    return VigiflowUtils.ajustarFecha(fechaEsavi, -edadGestacional * DIAS_POR_SEMANA);
  }

  /**
   * Calcula la fecha probable de parto sumando a la fecha de última menstruación una
   * gestación a término.
   * FECHA_PARTO = FUM + (40 × 7 días)
   */
  static calcularFechaParto(fechaUltimaMenstruacion?: Date | null): Date | null {
    if (!fechaUltimaMenstruacion) return null;
    return VigiflowUtils.ajustarFecha(fechaUltimaMenstruacion, SEMANAS_GESTACION_A_TERMINO * DIAS_POR_SEMANA);
  }

  /** Devuelve una nueva fecha desplazada la cantidad de días indicada (positiva o negativa). */
  static ajustarFecha(fecha: Date, dias: number): Date {
    const resultado = new Date(fecha.getTime());
    resultado.setUTCDate(resultado.getUTCDate() + dias);
    return resultado;
  }

  /**
   * Homologa el estado final reportado en la columna "Resultado" (hoja Reacciones) a los
   * códigos numéricos acordados. Si el criterio de gravedad indica muerte o el resultado
   * es "Fatal", prevalece el código 5 sobre cualquier otro valor.
   * Retorna 0 (Desconocido) cuando no hay valor o no coincide con ningún término conocido.
   */
  static mapearResultadoEvento(resultado?: string, criterioGravedad?: string): ResultadoEvento {
    // Regla de consistencia: la muerte reportada en los criterios de gravedad prevalece.
    if (VigiflowUtils.contieneCriterioGravedad(criterioGravedad, 'muerte')) {
      return ResultadoEvento.MUERTE;
    }

    const normalizado = VigiflowUtils.normalizarTexto(resultado ?? '');
    if (normalizado.trim() === '') {
      return ResultadoEvento.DESCONOCIDO;
    }

    const coincidencia = TERMINOS_RESULTADO_EVENTO.find(({ termino }) => normalizado.includes(termino));
    return coincidencia ? coincidencia.codigo : ResultadoEvento.DESCONOCIDO;
  }

  /**
   * Cuando una notificación reporta varios resultados (uno por evento ESAVI), selecciona
   * uno solo aplicando la prioridad por severidad: 5 > 4 > 3 > 2 > 1 > 0.
   * Los criterios de gravedad se evalúan en paralelo, posición a posición.
   */
  static seleccionarResultadoPrioritario(resultados: string[], criteriosGravedad: string[] = []): ResultadoEvento {
    if (!resultados || resultados.length === 0) {
      // Aun sin resultados, un criterio de gravedad "Muerte" debe reflejarse.
      return criteriosGravedad.some((criterio) => VigiflowUtils.contieneCriterioGravedad(criterio, 'muerte'))
        ? ResultadoEvento.MUERTE
        : ResultadoEvento.DESCONOCIDO;
    }

    return resultados.reduce<ResultadoEvento>((prioritario, resultado, indice) => {
      const codigo = VigiflowUtils.mapearResultadoEvento(resultado, criteriosGravedad[indice]);
      return codigo > prioritario ? codigo : prioritario;
    }, ResultadoEvento.DESCONOCIDO);
  }

  /**
   * Indica si la celda "Criterio (s) de Gravedad" contiene el término buscado.
   * La comparación ignora tildes y mayúsculas, y admite celdas multilínea.
   */
  static contieneCriterioGravedad(criterios?: string, termino?: string): boolean {
    if (!criterios || !termino) return false;
    return VigiflowUtils.normalizarTexto(criterios).includes(VigiflowUtils.normalizarTexto(termino));
  }

  /**
   * Traduce a '1' (presente) o '0' (ausente) la presencia de un término dentro de la
   * columna "Criterio (s) de Gravedad". Las columnas de TR_GRAVEDAD_ESAVI se almacenan
   * como texto '1'/'0', no como booleanos.
   */
  static marcarCriterioGravedad(criterios?: string, termino?: string): string {
    return VigiflowUtils.contieneCriterioGravedad(criterios, termino) ? '1' : '0';
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
    } catch {}
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

  /**
   * Retorna true para 'sí'/'si', false para 'no' y null para cualquier otro valor.
   * La comparación es exacta contra el valor normalizado (sin tildes ni mayúsculas): un
   * "contains" marcaría como afirmativo cualquier texto con la letra "s" ("Sin dato",
   * "Desconocido"). Una celda multilínea ("Sí\r\nSí") se resuelve por su primera línea:
   * VigiFlow repite el mismo valor una vez por evento del caso.
   */
  static esAfirmativo(valor: unknown): boolean | null {
    if (valor === null || valor === undefined) return null;
    const primeraLinea = valor.toString().split(/\r?\n/)[0];
    const val = VigiflowUtils.normalizarTexto(primeraLinea).trim();
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
