import { CodigosTerritorialesUtils } from 'src/utils/codigos-territoriales.util';

/*
 * El cero a la izquierda no es cosmético: "70653" y "070653" son la misma parroquia, pero
 * sólo el segundo encuentra su fila en TC_DPA_PARROQUIA. Perderlo dejó al 41% del catálogo
 * de establecimientos sin provincia ni cantón.
 */
describe('CodigosTerritorialesUtils', () => {
  describe('parroquia', () => {
    it('restituye el cero inicial que se pierde al leer el código como número', () => {
      expect(CodigosTerritorialesUtils.parroquia('70653')).toBe('070653');
      expect(CodigosTerritorialesUtils.parroquia('40651')).toBe('040651');
    });

    it('deja intacto el código que ya viene completo', () => {
      expect(CodigosTerritorialesUtils.parroquia('170150')).toBe('170150');
    });

    it('recorta los espacios de alrededor', () => {
      expect(CodigosTerritorialesUtils.parroquia('  040651  ')).toBe('040651');
    });

    it('devuelve null para vacío, nulo o indefinido', () => {
      expect(CodigosTerritorialesUtils.parroquia('')).toBeNull();
      expect(CodigosTerritorialesUtils.parroquia('   ')).toBeNull();
      expect(CodigosTerritorialesUtils.parroquia(null)).toBeNull();
      expect(CodigosTerritorialesUtils.parroquia(undefined)).toBeNull();
    });

    /*
     * La siembra crea parroquias "Desconocido-{canton}" por cada cantón. No son códigos INEC
     * y rellenarlas con ceros las estropearía.
     */
    it('no toca los valores que no son íntegramente numéricos', () => {
      expect(CodigosTerritorialesUtils.parroquia('Desconocido-0406')).toBe('Desconocido-0406');
    });

    it('no recorta ni altera un código más largo del ancho esperado', () => {
      expect(CodigosTerritorialesUtils.parroquia('1701501')).toBe('1701501');
    });
  });

  describe('canton y provincia', () => {
    it('rellena al ancho INEC que corresponde a cada nivel', () => {
      expect(CodigosTerritorialesUtils.canton('406')).toBe('0406');
      expect(CodigosTerritorialesUtils.provincia('4')).toBe('04');
    });
  });

  describe('unicodigo', () => {
    /*
     * TR_ESTABLECIMIENTO se sembró con el unicódigo a seis dígitos. DHIS2 puede entregar la
     * unidad organizativa sin los ceros, y sin normalizar no encuentra su establecimiento.
     */
    it('normaliza el unicódigo de establecimiento a seis dígitos', () => {
      expect(CodigosTerritorialesUtils.unicodigo('2526')).toBe('002526');
      expect(CodigosTerritorialesUtils.unicodigo('002526')).toBe('002526');
    });

    it('devuelve null cuando no hay código', () => {
      expect(CodigosTerritorialesUtils.unicodigo(null)).toBeNull();
    });
  });
});
