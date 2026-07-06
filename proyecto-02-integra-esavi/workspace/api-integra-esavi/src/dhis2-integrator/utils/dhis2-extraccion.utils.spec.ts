import { ConfigService } from '@nestjs/config';
import { Dhis2ExtraccionUtils } from './dhis2-extraccion.utils';

describe('Dhis2ExtraccionUtils', () => {
  // ─── getConfig ───────────────────────────────────────────────────────────

  describe('getConfig', () => {
    const makeConfigService = (valores: Record<string, string>) =>
      ({
        get: jest.fn((key: string) => valores[key]),
      } as unknown as ConfigService);

    it('arma la cabecera Authorization con ApiToken desde DHIS2_API_TOKEN', () => {
      const configService = makeConfigService({ DHIS2_API_TOKEN: 'd2pat_abc' });
      const config = Dhis2ExtraccionUtils.getConfig(configService);
      expect(config.headers.Authorization).toBe('ApiToken d2pat_abc');
      expect(config.maxBodyLength).toBe(Infinity);
    });

    it('usa DHIS2_USER_KEY como respaldo cuando no existe DHIS2_API_TOKEN', () => {
      const configService = makeConfigService({ DHIS2_USER_KEY: 'd2pat_xyz' });
      const config = Dhis2ExtraccionUtils.getConfig(configService);
      expect(config.headers.Authorization).toBe('ApiToken d2pat_xyz');
    });

    it('prefiere DHIS2_API_TOKEN cuando ambos existen', () => {
      const configService = makeConfigService({
        DHIS2_API_TOKEN: 'd2pat_principal',
        DHIS2_USER_KEY: 'd2pat_respaldo',
      });
      const config = Dhis2ExtraccionUtils.getConfig(configService);
      expect(config.headers.Authorization).toBe('ApiToken d2pat_principal');
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
