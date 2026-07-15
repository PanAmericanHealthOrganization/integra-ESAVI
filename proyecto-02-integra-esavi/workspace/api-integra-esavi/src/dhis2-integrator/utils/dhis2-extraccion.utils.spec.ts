import { Dhis2ExtraccionUtils } from './dhis2-extraccion.utils';

describe('Dhis2ExtraccionUtils', () => {
  const makeParametroService = (parametros: Record<string, string> = {}) =>
    ({
      getValor: jest.fn(async (modulo: string, clave: string) => {
        if (modulo === 'DHIS2' && parametros[clave] !== undefined) {
          return parametros[clave];
        }
        throw new Error(`Parámetro no encontrado: ${modulo}.${clave}`);
      }),
    } as unknown as import('../../integrator/service/parametro.service').ParametroService);

  // ─── getConfig ───────────────────────────────────────────────────────────

  describe('getConfig', () => {
    it('arma la cabecera Authorization con ApiToken desde DHIS2_USER_KEY (TC_PARAMETRO)', async () => {
      const config = await Dhis2ExtraccionUtils.getConfig(
        makeParametroService({ DHIS2_USER_KEY: 'd2pat_xyz' }),
      );
      expect(config.headers.Authorization).toBe('ApiToken d2pat_xyz');
      expect(config.maxBodyLength).toBe(Infinity);
    });

    it('lanza cuando el parámetro DHIS2_USER_KEY no está configurado', async () => {
      await expect(Dhis2ExtraccionUtils.getConfig(makeParametroService())).rejects.toThrow();
    });
  });

  // ─── getBaseUrl ──────────────────────────────────────────────────────────

  describe('getBaseUrl', () => {
    it('lee la URL desde el parámetro DHIS2_URL (TC_PARAMETRO)', async () => {
      const baseUrl = await Dhis2ExtraccionUtils.getBaseUrl(
        makeParametroService({ DHIS2_URL: 'http://parametro' }),
      );
      expect(baseUrl).toBe('http://parametro');
    });

    it('lanza cuando el parámetro DHIS2_URL no está configurado', async () => {
      await expect(Dhis2ExtraccionUtils.getBaseUrl(makeParametroService())).rejects.toThrow();
    });
  });

  // ─── getRootOrgUnit ──────────────────────────────────────────────────────

  describe('getRootOrgUnit', () => {
    it('lee la unidad raíz desde el parámetro DHIS2_ROOT_ORG_UNIT (TC_PARAMETRO)', async () => {
      const rootOrgUnit = await Dhis2ExtraccionUtils.getRootOrgUnit(
        makeParametroService({ DHIS2_ROOT_ORG_UNIT: 'OU_RAIZ' }),
      );
      expect(rootOrgUnit).toBe('OU_RAIZ');
    });

    it('usa el valor por defecto cuando no existe el parámetro', async () => {
      const rootOrgUnit = await Dhis2ExtraccionUtils.getRootOrgUnit(makeParametroService());
      expect(rootOrgUnit).toBe('CcPKoI4rpPZ');
    });
  });

  // ─── dividirEnLotes ──────────────────────────────────────────────────────

  describe('dividirEnLotes', () => {
    it('divide una lista en lotes del tamaño indicado', () => {
      expect(Dhis2ExtraccionUtils.dividirEnLotes([1, 2, 3, 4, 5], 2)).toEqual([
        [1, 2],
        [3, 4],
        [5],
      ]);
    });

    it('devuelve un solo lote cuando la lista es menor al tamaño', () => {
      expect(Dhis2ExtraccionUtils.dividirEnLotes(['a'], 100)).toEqual([['a']]);
    });

    it('devuelve vacío para una lista vacía', () => {
      expect(Dhis2ExtraccionUtils.dividirEnLotes([], 10)).toEqual([]);
    });
  });

  // ─── normalizarValor ─────────────────────────────────────────────────────

  describe('normalizarValor', () => {
    it("convierte booleanos del tracker al formato de analytics ('true'→'1', 'false'→'0')", () => {
      expect(Dhis2ExtraccionUtils.normalizarValor('true', 'BOOLEAN')).toBe('1');
      expect(Dhis2ExtraccionUtils.normalizarValor('false', 'BOOLEAN')).toBe('0');
      expect(Dhis2ExtraccionUtils.normalizarValor('true', 'TRUE_ONLY')).toBe('1');
    });

    it('traduce el código de opción al nombre usando el mapa del option set', () => {
      const mapaOpciones = new Map([['SEX01', 'Masculino']]);
      expect(Dhis2ExtraccionUtils.normalizarValor('SEX01', 'TEXT', mapaOpciones)).toBe('Masculino');
    });

    it('conserva el valor cuando el código no está en el mapa de opciones', () => {
      const mapaOpciones = new Map([['SEX01', 'Masculino']]);
      expect(Dhis2ExtraccionUtils.normalizarValor('OTRO', 'TEXT', mapaOpciones)).toBe('OTRO');
    });

    it('conserva valores de texto sin option set ni tipo booleano', () => {
      expect(Dhis2ExtraccionUtils.normalizarValor('34', 'INTEGER')).toBe('34');
    });
  });

  // ─── normalizarFecha ─────────────────────────────────────────────────────

  describe('normalizarFecha', () => {
    it("reemplaza la 'T' ISO por espacio, como entrega analytics", () => {
      expect(Dhis2ExtraccionUtils.normalizarFecha('2024-03-10T00:00:00.000')).toBe(
        '2024-03-10 00:00:00.000',
      );
    });

    it('devuelve el valor tal cual cuando viene vacío', () => {
      expect(Dhis2ExtraccionUtils.normalizarFecha('')).toBe('');
      expect(Dhis2ExtraccionUtils.normalizarFecha(undefined as unknown as string)).toBeUndefined();
    });
  });

  // ─── idsUnicos ───────────────────────────────────────────────────────────

  describe('idsUnicos', () => {
    it('extrae ids únicos descartando vacíos y repetidos', () => {
      const items = [{ id: 'a' }, { id: 'b' }, { id: 'a' }, { id: undefined }, { id: '' }];
      expect(Dhis2ExtraccionUtils.idsUnicos(items, (item) => item.id)).toEqual(['a', 'b']);
    });
  });
});
