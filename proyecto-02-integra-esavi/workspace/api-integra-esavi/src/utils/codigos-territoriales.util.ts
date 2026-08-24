/**
 * Utilidades para los códigos con ceros a la izquierda que usan los catálogos territoriales
 * y el de establecimientos de salud.
 *
 * Existen por un motivo concreto: tanto la DPA del INEC como el unicódigo del MSP son
 * cadenas de ancho fijo cuyo primer carácter suele ser un cero —la provincia 04 es Carchi,
 * la parroquia 040651 es Mariscal Sucre—, pero viajan por hojas de cálculo y por el API de
 * DHIS2, donde a poco que algo los interprete como número el cero desaparece. Un "70653" y
 * un "070653" son el mismo lugar, y sin normalizarlos el segundo no encuentra su fila.
 *
 * Es abstracta para impedir su instanciación: todos los métodos son estáticos y puros, por
 * lo que pueden usarse y probarse de forma aislada.
 */
export abstract class CodigosTerritorialesUtils {
  /** Ancho del código INEC de provincia. */
  private static readonly ANCHO_PROVINCIA = 2;
  /** Ancho del código INEC de cantón. */
  private static readonly ANCHO_CANTON = 4;
  /** Ancho del código INEC de parroquia. */
  private static readonly ANCHO_PARROQUIA = 6;
  /** Ancho del unicódigo de establecimiento de salud del MSP. */
  private static readonly ANCHO_UNICODIGO = 6;

  /** Sólo se rellenan los códigos íntegramente numéricos. */
  private static readonly SOLO_DIGITOS = /^[0-9]+$/;

  /**
   * Restituye los ceros a la izquierda de un código, hasta el ancho indicado.
   *
   * Deja intacto lo que no sea íntegramente numérico —un "Desconocido-0406" no es un código
   * INEC y rellenarlo lo estropearía— y lo que ya alcance o supere el ancho pedido, para no
   * inventar dígitos donde el valor venga mal de origen.
   */
  private static rellenar(codigo: string | null | undefined, ancho: number): string | null {
    const valor = codigo?.trim();
    if (!valor) return null;
    if (!CodigosTerritorialesUtils.SOLO_DIGITOS.test(valor)) return valor;
    return valor.padStart(ancho, '0');
  }

  /** Normaliza un código de parroquia al ancho INEC de seis dígitos ("70653" → "070653"). */
  static parroquia(codigo: string | null | undefined): string | null {
    return CodigosTerritorialesUtils.rellenar(codigo, CodigosTerritorialesUtils.ANCHO_PARROQUIA);
  }

  /** Normaliza un código de cantón al ancho INEC de cuatro dígitos ("406" → "0406"). */
  static canton(codigo: string | null | undefined): string | null {
    return CodigosTerritorialesUtils.rellenar(codigo, CodigosTerritorialesUtils.ANCHO_CANTON);
  }

  /** Normaliza un código de provincia al ancho INEC de dos dígitos ("4" → "04"). */
  static provincia(codigo: string | null | undefined): string | null {
    return CodigosTerritorialesUtils.rellenar(codigo, CodigosTerritorialesUtils.ANCHO_PROVINCIA);
  }

  /**
   * Normaliza el unicódigo de un establecimiento de salud a seis dígitos ("2526" → "002526").
   *
   * Es el formato con el que se sembró TR_ESTABLECIMIENTO, y con el que hay que comparar lo
   * que llega de DHIS2 como código de la unidad organizativa.
   */
  static unicodigo(codigo: string | null | undefined): string | null {
    return CodigosTerritorialesUtils.rellenar(codigo, CodigosTerritorialesUtils.ANCHO_UNICODIGO);
  }
}
