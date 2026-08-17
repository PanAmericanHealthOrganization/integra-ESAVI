import { SimilitudTrigramas } from './similitud-trigramas.utils';

/**
 * Los valores esperados no son inventados: se midieron con `SELECT similarity(...)` sobre
 * la propia base, y esta suite los fija para que la implementación en JavaScript no se
 * separe de pg_trgm. Si se separara, los umbrales acordados (0.6 y 0.7) dejarían de
 * significar lo que se calibró.
 */
describe('SimilitudTrigramas', () => {
  describe('compatibilidad con similarity() de pg_trgm', () => {
    it.each<[string, string, number]>([
      // Medidos en PostgreSQL con la extensión pg_trgm instalada.
      ['Glaxo SmithKline', 'GlaxoSmithKline', 14 / 19],
      ['Glaxosmithkline', 'GlaxoSmithKline', 1],
      ['Merck sharp & dohme', 'Merck Sharp & Dohme LLC', 0.8181818],
      ['Sk bioscience', 'SK Bioscience Co., Ltd.', 0.6666667],
      ['Glaxosmithkline biologicals', 'GlaxoSmithKline', 0.5714286],
      ['Smithkline beecham mexico', 'GlaxoSmithKline', 0.2727273],
    ])('similarity(%s, %s)', (a, b, esperado) => {
      expect(SimilitudTrigramas.entre(a, b)).toBeCloseTo(esperado, 6);
    });

    it('es simétrica', () => {
      const a = 'Merck sharp & dohme';
      const b = 'Merck Sharp & Dohme LLC';
      expect(SimilitudTrigramas.entre(a, b)).toBe(SimilitudTrigramas.entre(b, a));
    });

    it('da 1 para textos iguales salvo mayúsculas y espacios sobrantes', () => {
      expect(SimilitudTrigramas.entre('  Gardasil 9 ', 'GARDASIL 9')).toBe(1);
    });

    /*
     * PostgreSQL trata las tildes como letras (no parten palabra) y sustituye por un hash
     * los trigramas multibyte. Como el hash es del contenido, la intersección no cambia:
     * aquí se comprueba que el ingrediente acentuado se compare consigo mismo al 100%.
     */
    it('trata las letras acentuadas como parte de la palabra', () => {
      expect(SimilitudTrigramas.entre('Vacuna toxoide diftérico', 'vacuna toxoide diftérico')).toBe(1);
      expect(SimilitudTrigramas.entre('diftérico', 'difterico')).toBeLessThan(1);
    });

    it('trata la puntuación como separador de palabras', () => {
      // 'S.A.' y 'S A' producen los mismos trigramas: el punto sólo separa.
      expect(SimilitudTrigramas.entre('Laboratorio S.A.', 'Laboratorio S A')).toBe(1);
    });
  });

  describe('casos límite', () => {
    it.each([
      [null, 'Merck'],
      ['Merck', null],
      [undefined, undefined],
      ['', 'Merck'],
      ['   ', 'Merck'],
      ['...', 'Merck'],
    ])('devuelve 0 si falta alguno de los textos o no aporta trigramas (%s, %s)', (a, b) => {
      expect(SimilitudTrigramas.entre(a as any, b as any)).toBe(0);
    });
  });

  describe('superaUmbral', () => {
    it('es exclusivo, igual que "> :umbral" en SQL', () => {
      // Idénticos dan exactamente 1, que sí supera 0.9999 pero no 1.
      expect(SimilitudTrigramas.superaUmbral('Gardasil', 'Gardasil', 0.9999)).toBe(true);
      expect(SimilitudTrigramas.superaUmbral('Gardasil', 'Gardasil', 1)).toBe(false);
    });

    it('separa el titular correcto del que sólo comparte una palabra', () => {
      expect(SimilitudTrigramas.superaUmbral('Merck sharp & dohme', 'Merck Sharp & Dohme LLC', 0.6)).toBe(true);
      expect(SimilitudTrigramas.superaUmbral('Smithkline beecham mexico', 'GlaxoSmithKline', 0.6)).toBe(false);
    });
  });
});
