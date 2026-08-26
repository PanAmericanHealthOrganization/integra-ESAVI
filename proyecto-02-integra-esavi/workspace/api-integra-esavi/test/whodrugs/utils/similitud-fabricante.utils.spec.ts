import { SimilitudFabricante } from 'src/whodrugs/utils/similitud-fabricante.utils';

/*
 * Los pares de estas pruebas no son inventados: salen de cruzar la columna I del libro de
 * VigiFlow (el titular tal como lo declara el notificador) con MAHOLDER.NAME de la base
 * WHODrug. El umbral con el que se leen es el mismo que usa la codificación, 0.6.
 */
const UMBRAL = 0.6;

describe('SimilitudFabricante', () => {
  describe('normalizar', () => {
    it('quita tildes, puntuación y sufijos societarios', () => {
      expect(SimilitudFabricante.normalizar('Merck Sharp & Dohme LLC')).toBe('merck sharp & dohme');
      expect(SimilitudFabricante.normalizar('Green Cross Corporation')).toBe('green cross');
    });

    /*
     * El orden importa: si la puntuación se convierte en espacios antes de quitar los
     * sufijos, «S.A.» se parte en «s» y «a» y sobrevive entero. Era lo que impedía emparejar
     * «Laboratorios Bagó S.A.» con «Laboratorios Bago».
     */
    it('pega las abreviaturas con puntos antes de descartar sufijos', () => {
      expect(SimilitudFabricante.normalizar('Laboratorios Bagó S.A.')).toBe('bago');
      expect(SimilitudFabricante.normalizar('Serum Institute of India Pvt. Ltd.')).toBe('serum institute of india');
    });

    it('conserva el nombre original cuando todo él es razón social', () => {
      expect(SimilitudFabricante.normalizar('Pharma Group Ltd')).toBe('pharma group ltd');
    });
  });

  describe('entre', () => {
    /* Señal 1: el mismo nombre con sufijos societarios o tildes de diferencia. */
    it.each([
      ['Merck Sharp & Dohme LLC', 'Merck sharp & dohme'],
      ['SK Bioscience Co., Ltd.', 'SK bioscience'],
      ['Sanofi Pasteur Limited', 'Sanofi pasteur'],
      ['Laboratorios Bagó S.A.', 'Laboratorios Bago'],
      ['Biological E. Limited', 'Biological E'],
    ])('reconoce «%s» y «%s» como el mismo laboratorio', (reportado, diccionario) => {
      expect(SimilitudFabricante.entre(reportado, diccionario)).toBe(1);
    });

    /*
     * Señal 2: en ECU las vacunas del programa ampliado se registran a nombre del Ministerio
     * junto al fabricante, y el notificador declara sólo el fabricante. Es el caso que
     * ninguna métrica global resuelve, porque todas penalizan el sobrante.
     */
    it.each([
      ['Serum Institute of India Pvt. Ltd.', 'Ministerio de Salud Publica - Ecuador, Serum Institute of India'],
      ['Bharat Biotech International Limited', 'Ministerio de Salud Publica - Ecuador, Bharat Biotech International'],
      ['Sanofi Pasteur', 'Ministerio de Salud Publica - Ecuador, Sanofi Pasteur'],
      ['BIOLOGICAL E-LIMITED', 'Ministerio de Salud Publica - Ecuador, Biological E.'],
      ['Pfizer Europe MA EEIG', 'Pfizer'],
    ])('encuentra «%s» contenido en «%s»', (reportado, diccionario) => {
      expect(SimilitudFabricante.entre(reportado, diccionario)).toBeGreaterThan(UMBRAL);
    });

    /* Señal 3: la misma razón social escrita junta o separada. */
    it.each([
      ['GlaxoSmithKline Biologicals SA', 'Glaxosmithkline'],
      ['GlaxoSmithKline plc', 'Glaxo Smith Kline'],
    ])('empareja «%s» con «%s» pese al espaciado', (reportado, diccionario) => {
      expect(SimilitudFabricante.entre(reportado, diccionario)).toBeGreaterThan(UMBRAL);
    });

    /*
     * Lo que NO debe emparejar. «Sanofi Pasteur» contra «Sanofi aventis» es el par exigente:
     * comparten la mitad del nombre y aun así son titulares distintos del diccionario.
     */
    it.each([
      ['Sanofi Pasteur', 'Sanofi aventis'],
      ['LG Chem Ltd', 'LG Life Sciences'],
      ['Biological E. Limited', 'Berna'],
      ['Seqirus Limited', 'Sanofi aventis'],
      ['Serum Institute of India Pvt. Ltd.', 'Ministerio de Salud Publica - Ecuador, Biological E.'],
    ])('no empareja «%s» con «%s»', (reportado, diccionario) => {
      expect(SimilitudFabricante.entre(reportado, diccionario)).toBeLessThanOrEqual(UMBRAL);
    });

    it('devuelve 0 si falta cualquiera de los dos nombres', () => {
      expect(SimilitudFabricante.entre(null, 'Pfizer')).toBe(0);
      expect(SimilitudFabricante.entre('Pfizer', undefined)).toBe(0);
      expect(SimilitudFabricante.entre('   ', 'Pfizer')).toBe(0);
    });
  });

  describe('superaUmbral', () => {
    it('trata el umbral como exclusivo, igual que SimilitudTrigramas', () => {
      expect(SimilitudFabricante.superaUmbral('Pfizer', 'Pfizer', 1)).toBe(false);
      expect(SimilitudFabricante.superaUmbral('Pfizer', 'Pfizer', 0.99)).toBe(true);
    });
  });
});
