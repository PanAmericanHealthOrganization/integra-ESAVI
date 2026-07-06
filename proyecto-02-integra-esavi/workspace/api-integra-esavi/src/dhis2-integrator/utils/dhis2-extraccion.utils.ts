import { ConfigService } from '@nestjs/config';

/**
 * Utilidades para la extracción de datos crudos desde el API de eventos/tracker de DHIS2
 * y su normalización al formato que entrega el API de analytics (headers/rows),
 * de modo que el pipeline de persistencia no requiera cambios.
 */
export abstract class Dhis2ExtraccionUtils {
  /**
   * Configuración común de las peticiones HTTP a DHIS2: autenticación por
   * Personal Access Token (DHIS2_API_TOKEN o DHIS2_USER_KEY).
   */
  static getConfig(configService: ConfigService) {
    const token =
      configService.get<string>('DHIS2_API_TOKEN') ??
      configService.get<string>('DHIS2_USER_KEY');
    return {
      maxBodyLength: Infinity,
      headers: {
        Authorization: `ApiToken ${token}`,
      },
    };
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
