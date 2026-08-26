/**
 * Parecido entre dos nombres de laboratorio titular.
 *
 * El titular se compara en dos sitios de la codificación WHODrug: el filtro que estrecha las
 * candidatas por la columna I del Excel de VigiFlow, y el orden con el que se elige, entre
 * varios titulares del mismo medicamento, de cuál salen MEDICINAL_PRODUCT_ID y
 * MA_HOLDER_MEDI_PROD_ID. En ambos, comparar los nombres tal cual falla por tres motivos
 * distintos, y por eso la puntuación es el máximo de tres señales en vez de una sola métrica:
 *
 *  1. **Sufijos societarios y tildes.** «Merck Sharp & Dohme LLC» contra «Merck sharp &
 *     dohme», «Laboratorios Bagó S.A.» contra «Laboratorios Bago». Se resuelve normalizando
 *     antes de medir: sin tildes, sin puntuación y sin los sufijos de la lista.
 *
 *  2. **El titular ecuatoriano es un nombre compuesto que contiene al reportado.** En ECU
 *     WHODrug registra «Ministerio de Salud Publica - Ecuador, Serum Institute of India»
 *     frente al «Serum Institute of India Pvt. Ltd.» que declara el notificador, o «Pfizer»
 *     frente a «Pfizer Europe MA EEIG». Ninguna métrica global sirve aquí —todas penalizan
 *     el sobrante—, así que se mide la contención: qué proporción del nombre más corto
 *     aparece en el más largo.
 *
 *  3. **La misma razón social escrita junta o separada.** «GlaxoSmithKline» contra «Glaxo
 *     Smith Kline» no comparte ningún token y su parecido por trigramas se queda corto; se
 *     compara también con los espacios quitados, donde son idénticas.
 *
 * Se toma el máximo y no un promedio ponderado: cada señal reconoce una forma distinta de
 * ser el mismo laboratorio, y promediarlas hace que las dos que no aplican hundan a la que
 * sí. Medido sobre los titulares reales del libro de VigiFlow contra los de la base, el
 * máximo acierta en los 18 pares de referencia; un promedio 0,6 Levenshtein + 0,4 Jaccard
 * acierta 10, y los trigramas por sí solos, 11.
 */
import {SimilitudTrigramas} from './similitud-trigramas.utils';

export abstract class SimilitudFabricante {
  /**
   * Sufijos societarios y de giro que no distinguen a un laboratorio de otro. Se eliminan
   * de los dos lados antes de comparar, así que sólo importa que estén: quitar «Limited» de
   * ambos nombres no cambia cuál es más parecido, y quitarlo de uno solo era justamente el
   * ruido que impedía el emparejamiento.
   *
   * `international`, `global`, `pharma` y `laboratories` están a propósito: distinguen la
   * sociedad del grupo, no el grupo, y es el grupo lo que se busca. Ampliar la lista es la
   * forma prevista de adaptarla a nuevas convenciones de los notificadores.
   */
  private static readonly SUFIJOS_SOCIETARIOS = new Set([
    'llc', 'inc', 'incorporated', 'corp', 'corporation', 'co', 'company',
    'ltd', 'ltda', 'limited', 'plc', 'gmbh', 'ag', 'kg', 'sa', 'sas', 'srl', 'spa',
    'bv', 'nv', 'ab', 'as', 'oy', 'aps', 'sarl', 'sl', 'sac', 'cv', 'pvt', 'pte',
    'cia', 'compania', 'pharmaceuticals', 'pharmaceutical', 'pharma',
    'laboratories', 'laboratory', 'labs', 'laboratorios', 'laboratorio',
    'group', 'holdings', 'international', 'global',
  ]);

  /**
   * Longitud mínima de un token para que cuente en la contención. Descarta iniciales y
   * partículas —la «E» de «Biological E», los «de» y «of»—, que aparecen en demasiados
   * nombres como para que su coincidencia signifique algo.
   */
  private static readonly LONGITUD_MINIMA_TOKEN = 3;

  /** Parecido entre dos nombres de laboratorio, de 0 a 1. */
  static entre(fabricanteA?: string | null, fabricanteB?: string | null): number {
    if (!fabricanteA || !fabricanteB) return 0;

    const a = SimilitudFabricante.normalizar(fabricanteA);
    const b = SimilitudFabricante.normalizar(fabricanteB);
    if (a === '' || b === '') return 0;

    return Math.max(
      SimilitudTrigramas.entre(a, b),
      SimilitudFabricante.contencion(a, b),
      // Sin espacios: «glaxo smith kline» y «glaxosmithkline» pasan a ser la misma cadena.
      SimilitudTrigramas.entre(a.replace(/\s+/g, ''), b.replace(/\s+/g, '')),
    );
  }

  /** ¿Superan los dos nombres el umbral indicado? Umbral exclusivo, igual que `> :umbral`. */
  static superaUmbral(fabricanteA: string | null | undefined, fabricanteB: string | null | undefined, umbral: number): boolean {
    return SimilitudFabricante.entre(fabricanteA, fabricanteB) > umbral;
  }

  /**
   * Deja el nombre en su forma comparable: minúsculas, sin tildes, sin puntuación y sin
   * sufijos societarios.
   *
   * Las abreviaturas con puntos se pegan **antes** de convertir la puntuación en espacios.
   * Al revés —que es como suele escribirse— «S.A.» se parte en los tokens «s» y «a», ninguno
   * de los cuales está en la lista, y el sufijo sobrevive: es lo que hacía que «Laboratorios
   * Bagó S.A.» no llegara a emparejar con «Laboratorios Bago».
   *
   * Si al quitar los sufijos no queda nada —un nombre que es sólo razón social— se conservan
   * los tokens originales: es preferible comparar de más que no tener con qué comparar.
   */
  static normalizar(nombre: string): string {
    // \u0300-\u036f es el bloque de diacríticos combinantes que NFD separa de su letra.
    let texto = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    // «s.a.» → «sa», «u.s.a.» → «usa»; el punto final lo barre la línea siguiente.
    texto = texto.replace(/\b([a-z])\.(?=[a-z]\b)/g, '$1');
    texto = texto.replace(/[^a-z0-9\s&]/g, ' ').replace(/\s+/g, ' ').trim();

    const tokens = texto.split(' ').filter((token) => token !== '');
    const significativos = tokens.filter((token) => !SimilitudFabricante.SUFIJOS_SOCIETARIOS.has(token));
    return (significativos.length > 0 ? significativos : tokens).join(' ');
  }

  /**
   * Qué proporción del nombre más corto aparece en el más largo (coeficiente de
   * solapamiento). Es la señal que reconoce al titular reportado dentro del nombre compuesto
   * con que WHODrug registra las vacunas del programa ampliado de inmunizaciones.
   *
   * Es deliberadamente permisiva —«Pfizer» contra «Pfizer Europe MA EEIG» da 1— porque en la
   * fase 1 no decide sola: sólo estrecha un conjunto de candidatas que ya comparten
   * composición, y lo que quede empatado lo resuelven el nombre comercial y la composición
   * exacta, o no se codifica.
   */
  private static contencion(a: string, b: string): number {
    const tokensA = SimilitudFabricante.tokensSignificativos(a);
    const tokensB = SimilitudFabricante.tokensSignificativos(b);
    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    const [menor, mayor] = tokensA.size <= tokensB.size ? [tokensA, tokensB] : [tokensB, tokensA];
    let comunes = 0;
    for (const token of menor) {
      if (mayor.has(token)) comunes++;
    }
    return comunes / menor.size;
  }

  /** Tokens con los que se mide la contención: los que llegan a `LONGITUD_MINIMA_TOKEN`. */
  private static tokensSignificativos(normalizado: string): Set<string> {
    return new Set(
      normalizado.split(' ').filter((token) => token.length >= SimilitudFabricante.LONGITUD_MINIMA_TOKEN),
    );
  }
}
