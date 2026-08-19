import { ParametroService } from '../../integrator/service/parametro.service';

/**
 * Utilidades para la extracción de datos crudos desde el API de eventos/tracker de DHIS2
 * y su normalización al formato que entrega el API de analytics (headers/rows),
 * de modo que el pipeline de persistencia no requiera cambios.
 */
export abstract class Dhis2ExtraccionUtils {
  /** Módulo bajo el que se almacenan los parámetros de DHIS2 en TC_PARAMETRO. */
  private static readonly MODULO = 'DHIS2';

  /** Unidad organizativa raíz por defecto cuando no está configurada en TC_PARAMETRO. */
  private static readonly DEFAULT_ROOT_ORG_UNIT = 'CcPKoI4rpPZ';

  /**
   * URL base del servidor DHIS2 al que se dirigen las consultas. Se lee del
   * parámetro DHIS2_URL en TC_PARAMETRO en cada consulta (ParametroService
   * cachea el valor por unos minutos). Lanza si el parámetro no existe.
   */
  static async getBaseUrl(parametroService: ParametroService): Promise<string> {
    return parametroService.getValor(Dhis2ExtraccionUtils.MODULO, 'DHIS2_URL');
  }

  /**
   * Configuración común de las peticiones HTTP a DHIS2: autenticación básica con
   * el usuario y la contraseña de los parámetros DHIS2_USERNAME y DHIS2_PASSWD
   * en TC_PARAMETRO, leídos en cada consulta. Lanza si algún parámetro no existe.
   *
   * Se usa autenticación básica y no un Personal Access Token porque los PAT de
   * DHIS2 admiten una lista blanca de IPs de origen: si el servidor que ejecuta
   * la sincronización sale por una IP distinta a la registrada, DHIS2 responde
   * «Failed to authenticate API token, request ip address is not allowed» y la
   * importación falla entera. La autenticación básica no está sujeta a esa
   * restricción, así que no se rompe al cambiar de red o de servidor.
   */
  static async getConfig(parametroService: ParametroService) {
    const [usuario, clave] = await Promise.all([
      parametroService.getValor(Dhis2ExtraccionUtils.MODULO, 'DHIS2_USERNAME'),
      parametroService.getValor(Dhis2ExtraccionUtils.MODULO, 'DHIS2_PASSWD'),
    ]);
    const credenciales = Buffer.from(`${usuario}:${clave}`).toString('base64');
    return {
      maxBodyLength: Infinity,
      headers: {
        Authorization: `Basic ${credenciales}`,
      },
    };
  }

  /**
   * Unidad organizativa raíz sobre la que se consultan las instancias del
   * tracker. Se lee del parámetro DHIS2_ROOT_ORG_UNIT en TC_PARAMETRO; si no
   * está configurado, usa el valor por defecto.
   */
  static async getRootOrgUnit(parametroService: ParametroService): Promise<string> {
    return (
      (await Dhis2ExtraccionUtils.getParametroOpcional(parametroService, 'DHIS2_ROOT_ORG_UNIT')) ??
      Dhis2ExtraccionUtils.DEFAULT_ROOT_ORG_UNIT
    );
  }

  /**
   * Lee un parámetro del módulo DHIS2 desde TC_PARAMETRO devolviendo undefined
   * en lugar de lanzar cuando no existe, para parámetros con valor por defecto.
   */
  private static async getParametroOpcional(
    parametroService: ParametroService,
    clave: string,
  ): Promise<string | undefined> {
    try {
      return await parametroService.getValor(Dhis2ExtraccionUtils.MODULO, clave);
    } catch {
      return undefined;
    }
  }

  /**
   * Divide una lista de ids en lotes para no exceder el largo máximo de la URL
   * en los filtros id:in:[...] de la API de metadatos.
   */
  static dividirEnLotes<T>(items: T[], tamanioLote: number): T[][] {
    const lotes: T[][] = [];
    for (let i = 0; i < items.length; i += tamanioLote) {
      lotes.push(items.slice(i, i + tamanioLote));
    }
    return lotes;
  }

  /**
   * Normaliza un valor crudo del tracker al formato que entrega analytics:
   * - BOOLEAN / TRUE_ONLY: el tracker entrega 'true'/'false'; analytics entrega '1'/'0'.
   * - Option sets: el tracker entrega el código de la opción; analytics entrega el nombre.
   * El resto de valores se conserva tal cual.
   */
  static normalizarValor(
    valor: string,
    valueType?: string,
    mapaOpciones?: Map<string, string>,
  ): string {
    if (valor === null || valor === undefined) {
      return valor;
    }
    if (valueType === 'BOOLEAN' || valueType === 'TRUE_ONLY') {
      if (valor === 'true') return '1';
      if (valor === 'false') return '0';
      return valor;
    }
    if (mapaOpciones) {
      return mapaOpciones.get(valor) ?? valor;
    }
    return valor;
  }

  /**
   * Normaliza fechas del tracker ('2024-01-15T00:00:00.000') al formato
   * de analytics ('2024-01-15 00:00:00.0') para que el parseo aguas abajo
   * se comporte igual con ambas fuentes.
   */
  static normalizarFecha(valor: string): string {
    if (!valor) {
      return valor;
    }
    return valor.replace('T', ' ');
  }

  /**
   * Extrae los ids únicos (no vacíos) producidos por un extractor sobre una lista.
   */
  static idsUnicos<T>(items: T[], extractor: (item: T) => string | undefined): string[] {
    return [...new Set(items.map(extractor).filter((id) => !!id))];
  }
}
