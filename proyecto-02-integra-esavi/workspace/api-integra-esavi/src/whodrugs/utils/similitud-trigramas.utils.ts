/**
 * Similitud de trigramas compatible con `similarity()` de la extensión pg_trgm.
 *
 * La codificación WHODrug filtra en JavaScript sobre un resultado ya traído de la base, no
 * en SQL. Para que los umbrales acordados (0.6 para el laboratorio, 0.7 para el nombre del
 * medicamento) signifiquen lo mismo que cuando se midieron con `SELECT similarity(...)`,
 * esta implementación reproduce el algoritmo de PostgreSQL, no una noción propia de
 * parecido:
 *
 *  1. El texto se pasa a minúsculas y se parte en palabras por cualquier carácter que no
 *     sea letra o dígito (la puntuación separa; las tildes no, son letras).
 *  2. Cada palabra se acolcha como `"  palabra "` —dos espacios delante, uno detrás— y de
 *     ahí se extraen todos los trigramas deslizantes. Una palabra de n caracteres aporta
 *     n+1 trigramas.
 *  3. Se trabaja con el conjunto de trigramas distintos de cada texto, y la similitud es
 *     |A ∩ B| / |A ∪ B|.
 *
 * Comprobado contra `show_trgm` y `similarity` de la propia base: `show_trgm('word')`
 * devuelve `{"  w"," wo",wor,ord,"rd "}`, y
 * `similarity('Glaxo SmithKline', 'GlaxoSmithKline')` da 0.7368, que es 14/19.
 *
 * PostgreSQL sustituye por un hash los trigramas que contienen caracteres multibyte, pero
 * el hash es del contenido: trigramas iguales siguen siendo iguales y distintos siguen
 * siendo distintos, así que la intersección —y por tanto la similitud— no cambia.
 */
export abstract class SimilitudTrigramas {
  /** Separador de palabras: todo lo que no sea letra Unicode o dígito. */
  private static readonly NO_ALFANUMERICO = /[^\p{L}\p{N}]+/u;

  /**
   * Similitud entre dos textos, de 0 a 1. Devuelve 0 si falta cualquiera de los dos o si
   * ninguno aporta trigramas (por ejemplo, si sólo traen puntuación).
   */
  static entre(textoA?: string | null, textoB?: string | null): number {
    const a = SimilitudTrigramas.trigramas(textoA);
    const b = SimilitudTrigramas.trigramas(textoB);
    if (a.size === 0 || b.size === 0) return 0;

    let comunes = 0;
    // Se recorre el conjunto menor: el coste es el del más pequeño, no el de la suma.
    const [menor, mayor] = a.size <= b.size ? [a, b] : [b, a];
    for (const trigrama of menor) {
      if (mayor.has(trigrama)) comunes++;
    }

    const union = a.size + b.size - comunes;
    return union === 0 ? 0 : comunes / union;
  }

  /** ¿Superan los dos textos el umbral indicado? Umbral exclusivo, igual que `> :umbral`. */
  static superaUmbral(textoA: string | null | undefined, textoB: string | null | undefined, umbral: number): boolean {
    return SimilitudTrigramas.entre(textoA, textoB) > umbral;
  }

  /** Conjunto de trigramas distintos de un texto, con el mismo criterio que pg_trgm. */
  private static trigramas(texto?: string | null): Set<string> {
    const trigramas = new Set<string>();
    if (!texto) return trigramas;

    const palabras = texto
      .toLowerCase()
      .split(SimilitudTrigramas.NO_ALFANUMERICO)
      .filter((palabra) => palabra !== '');

    for (const palabra of palabras) {
      const acolchada = `  ${palabra} `;
      for (let inicio = 0; inicio + 3 <= acolchada.length; inicio++) {
        trigramas.add(acolchada.slice(inicio, inicio + 3));
      }
    }
    return trigramas;
  }
}
