import { MeddraArchivosUtils } from './meddra-archivos.utils';

describe('MeddraArchivosUtils', () => {
  describe('nombreBase', () => {
    it('se queda con el nombre del archivo, sin la carpeta del ZIP', () => {
      expect(MeddraArchivosUtils.nombreBase('ascii-280/llt.asc')).toBe('llt.asc');
      expect(MeddraArchivosUtils.nombreBase('MedDRA_28_0_Spanish/ascii-280/pt.asc')).toBe('pt.asc');
    });

    it('normaliza a minúsculas y quita espacios', () => {
      expect(MeddraArchivosUtils.nombreBase('  ASCII-280/SOC.ASC  ')).toBe('soc.asc');
    });

    it('neutraliza los intentos de salirse del directorio', () => {
      expect(MeddraArchivosUtils.nombreBase('../../etc/passwd')).toBe('passwd');
      expect(MeddraArchivosUtils.nombreBase('..\\..\\windows\\llt.asc')).toBe('llt.asc');
    });
  });

  describe('esArchivoConocido', () => {
    it('acepta los requeridos y los opcionales', () => {
      expect(MeddraArchivosUtils.esArchivoConocido('llt.asc')).toBe(true);
      expect(MeddraArchivosUtils.esArchivoConocido('smq_list.asc')).toBe(true);
    });

    it('acepta el histórico de cualquier idioma, que lleva el idioma en el nombre', () => {
      expect(MeddraArchivosUtils.esArchivoConocido('meddra_history_spanish.asc')).toBe(true);
      expect(MeddraArchivosUtils.esArchivoConocido('meddra_history_english.asc')).toBe(true);
    });

    it('rechaza lo que no pertenece a una distribución MedDRA', () => {
      expect(MeddraArchivosUtils.esArchivoConocido('factura.asc')).toBe(false);
      expect(MeddraArchivosUtils.esArchivoConocido('llt.txt')).toBe(false);
    });
  });

  describe('faltantes', () => {
    it('señala los requeridos ausentes', () => {
      expect(MeddraArchivosUtils.faltantes(['soc.asc', 'pt.asc'])).toContain('llt.asc');
    });

    it('no señala nada cuando la distribución está completa', () => {
      const completa = [...MeddraArchivosUtils.ARCHIVOS_REQUERIDOS];
      expect(MeddraArchivosUtils.faltantes(completa)).toEqual([]);
    });

    it('los opcionales no cuentan como faltantes', () => {
      const sinSmq = [...MeddraArchivosUtils.ARCHIVOS_REQUERIDOS];
      expect(MeddraArchivosUtils.faltantes(sinSmq)).toEqual([]);
    });

    it('admite un catálogo de requeridos distinto', () => {
      expect(
        MeddraArchivosUtils.faltantes(['soc.asc'], MeddraArchivosUtils.ARCHIVOS_A_PROCESAR),
      ).toEqual(['pt.asc', 'llt.asc', 'meddra_release.asc']);
    });
  });

  describe('desconocidos y duplicados', () => {
    it('lista los nombres fuera del catálogo', () => {
      expect(MeddraArchivosUtils.desconocidos(['soc.asc', 'raro.asc'])).toEqual(['raro.asc']);
    });

    it('detecta el mismo archivo en dos carpetas del ZIP', () => {
      expect(MeddraArchivosUtils.duplicados(['llt.asc', 'pt.asc', 'llt.asc'])).toEqual(['llt.asc']);
    });

    it('no marca duplicados cuando no los hay', () => {
      expect(MeddraArchivosUtils.duplicados(['llt.asc', 'pt.asc'])).toEqual([]);
    });
  });

  describe('leerRelease', () => {
    it('interpreta el sello de una distribución en español', () => {
      expect(MeddraArchivosUtils.leerRelease('28.0$Spanish$$$$')).toEqual({
        version: '28_0',
        idioma: 'ES',
      });
    });

    it('interpreta el de una en inglés', () => {
      expect(MeddraArchivosUtils.leerRelease('27.1$English$$$$')).toEqual({
        version: '27_1',
        idioma: 'EN',
      });
    });

    it('ignora lo que venga después de la primera línea', () => {
      expect(MeddraArchivosUtils.leerRelease('28.0$Spanish$$$$\nbasura\n').version).toBe('28_0');
    });

    it('devuelve idioma null si no reconoce el nombre del idioma', () => {
      expect(MeddraArchivosUtils.leerRelease('28.0$Japanese$$$$')).toEqual({
        version: '28_0',
        idioma: null,
      });
    });

    it('devuelve null si el contenido no tiene la forma esperada', () => {
      expect(MeddraArchivosUtils.leerRelease('')).toBeNull();
      expect(MeddraArchivosUtils.leerRelease('cualquier cosa')).toBeNull();
      expect(MeddraArchivosUtils.leerRelease('280$Spanish$')).toBeNull();
    });
  });

  describe('versionCoincide', () => {
    it('acepta la forma completa', () => {
      expect(MeddraArchivosUtils.versionCoincide('28_0', '28_0')).toBe(true);
    });

    it('acepta sólo la mayor, como las cargas históricas', () => {
      expect(MeddraArchivosUtils.versionCoincide('28', '28_0')).toBe(true);
    });

    it('rechaza otra versión', () => {
      expect(MeddraArchivosUtils.versionCoincide('27_1', '28_0')).toBe(false);
      expect(MeddraArchivosUtils.versionCoincide('28_1', '28_0')).toBe(false);
    });
  });

  describe('PATRON_VERSION', () => {
    it.each(['28', '28_0', '21_1', '9_2'])('acepta %s', (v) => {
      expect(MeddraArchivosUtils.PATRON_VERSION.test(v)).toBe(true);
    });

    it.each(['28.0', '', 'v28', '280_1', '28_'])('rechaza "%s"', (v) => {
      expect(MeddraArchivosUtils.PATRON_VERSION.test(v)).toBe(false);
    });
  });
});
