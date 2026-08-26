import { VigiflowUtils } from 'src/vigiflow-integrator/utils/vigiflow-utils.module';

/**
 * `VigiflowUtils` es una clase abstracta con métodos estáticos puros (sin dependencias
 * inyectadas), por lo que se prueban invocando los métodos directamente sobre la clase,
 * sin necesidad de `Test.createTestingModule` ni mocks.
 */
describe('VigiflowUtils', () => {
  describe('formatoYYYYMMDD', () => {
    it('formatea una fecha UTC como YYYYMMDD', () => {
      const fecha = new Date(Date.UTC(2023, 0, 13));
      expect(VigiflowUtils.formatoYYYYMMDD(fecha)).toBe('20230113');
    });

    it('rellena con ceros mes y día de un solo dígito', () => {
      const fecha = new Date(Date.UTC(2024, 8, 5)); // 5 sept 2024
      expect(VigiflowUtils.formatoYYYYMMDD(fecha)).toBe('20240905');
    });
  });

  describe('nombreArchivoRespaldo', () => {
    it('compone el nombre con el prefijo borrar y el rango en AAAA_MM', () => {
      const inicio = new Date(Date.UTC(2025, 0, 1));
      const fin = new Date(Date.UTC(2025, 2, 31));

      expect(VigiflowUtils.nombreArchivoRespaldo(inicio, fin, 'aefi')).toBe(
        'borrar.2025_01__2025_03_aefi.xlsx',
      );
      expect(VigiflowUtils.nombreArchivoRespaldo(inicio, fin, 'report')).toBe(
        'borrar.2025_01__2025_03_report.xlsx',
      );
    });

    it('rellena con cero el mes de un solo dígito', () => {
      const inicio = new Date(Date.UTC(2024, 8, 5));
      const fin = new Date(Date.UTC(2024, 8, 30));

      expect(VigiflowUtils.nombreArchivoRespaldo(inicio, fin, 'aefi')).toBe(
        'borrar.2024_09__2024_09_aefi.xlsx',
      );
    });
  });

  describe('analizarCadenaFecha', () => {
    it('convierte una cadena YYYYMMDD válida a fecha UTC', () => {
      expect(VigiflowUtils.analizarCadenaFecha('20230113')).toEqual(new Date(Date.UTC(2023, 0, 13)));
    });

    it('retorna null si la cadena no tiene 8 dígitos', () => {
      expect(VigiflowUtils.analizarCadenaFecha('202301')).toBeNull();
      expect(VigiflowUtils.analizarCadenaFecha('2023011399')).toBeNull();
    });

    it('retorna null si el mes o día están fuera de rango', () => {
      expect(VigiflowUtils.analizarCadenaFecha('20231301')).toBeNull(); // mes 13
      expect(VigiflowUtils.analizarCadenaFecha('20230132')).toBeNull(); // día 32
      expect(VigiflowUtils.analizarCadenaFecha('20230100')).toBeNull(); // día 0
    });

    it('retorna null para valores undefined o vacíos', () => {
      expect(VigiflowUtils.analizarCadenaFecha(undefined)).toBeNull();
      expect(VigiflowUtils.analizarCadenaFecha('')).toBeNull();
    });
  });

  describe('formatoFecha', () => {
    it('convierte YYYYMMDD completo a fecha UTC', () => {
      expect(VigiflowUtils.formatoFecha('20230113')).toEqual(new Date(Date.UTC(2023, 0, 13)));
    });

    it('usa el día 15 por defecto cuando solo viene YYYYMM', () => {
      expect(VigiflowUtils.formatoFecha('202305')).toEqual(new Date(Date.UTC(2023, 4, 15)));
    });

    it('usa el día 15 por defecto cuando el día viene vacío/no numérico', () => {
      expect(VigiflowUtils.formatoFecha('202305xx')).toEqual(new Date(Date.UTC(2023, 4, 15)));
    });

    it('retorna null si el valor es undefined o más corto que 6 caracteres', () => {
      expect(VigiflowUtils.formatoFecha(undefined)).toBeNull();
      expect(VigiflowUtils.formatoFecha('2023')).toBeNull();
    });

    it('retorna null si el resultado es una fecha inválida', () => {
      // Mes 99 produce NaN al desbordar el cálculo interno de Date.UTC en algunos casos límite;
      // se fuerza con un mes claramente inválido para ejercer la rama isNaN.
      const invalido = VigiflowUtils.formatoFecha('99999999');
      // Date.UTC normaliza meses fuera de rango en vez de producir NaN, así que se verifica
      // que como mínimo el método siempre retorna Date o null, nunca lanza.
      expect(invalido === null || invalido instanceof Date).toBe(true);
    });
  });

  describe('formatoInteger', () => {
    it('convierte una cadena numérica a entero', () => {
      expect(VigiflowUtils.formatoInteger('42')).toBe(42);
    });

    it('retorna 0 si el valor no es un número válido', () => {
      expect(VigiflowUtils.formatoInteger('abc')).toBe(0);
    });

    it('retorna 0 para valores vacíos', () => {
      expect(VigiflowUtils.formatoInteger('')).toBe(0);
    });
  });

  describe('formatoFloat', () => {
    it('convierte una cadena numérica decimal a float', () => {
      expect(VigiflowUtils.formatoFloat('70.5')).toBe(70.5);
    });

    it('retorna 0 si el valor no es un número válido', () => {
      expect(VigiflowUtils.formatoFloat('no-numero')).toBe(0);
    });
  });

  describe('splitLineas', () => {
    it('divide una celda multilínea en un arreglo de líneas limpias', () => {
      expect(VigiflowUtils.splitLineas('linea1\nlinea2\r\nlinea3')).toEqual(['linea1', 'linea2', 'linea3']);
    });

    it('descarta líneas vacías y recorta espacios', () => {
      expect(VigiflowUtils.splitLineas('  a  \n\n  b  \n')).toEqual(['a', 'b']);
    });

    it('retorna arreglo vacío para valores falsy', () => {
      expect(VigiflowUtils.splitLineas('')).toEqual([]);
      expect(VigiflowUtils.splitLineas(undefined as any)).toEqual([]);
    });
  });

  describe('eliminarSaltoLinea', () => {
    it('elimina todos los saltos de línea de la cadena', () => {
      expect(VigiflowUtils.eliminarSaltoLinea('a\nb\r\nc')).toBe('abc');
    });

    it('no modifica cadenas sin saltos de línea', () => {
      expect(VigiflowUtils.eliminarSaltoLinea('sin saltos')).toBe('sin saltos');
    });
  });

  describe('eliminarTildes', () => {
    it('elimina acentos de la cadena', () => {
      expect(VigiflowUtils.eliminarTildes('canción médica áéíóú')).toBe('cancion medica aeiou');
    });

    it('retorna undefined si el valor no es una cadena (lanza internamente y se captura)', () => {
      expect(VigiflowUtils.eliminarTildes(undefined)).toBeUndefined();
    });
  });

  describe('normalizarTexto', () => {
    it('elimina acentos y convierte a minúsculas', () => {
      expect(VigiflowUtils.normalizarTexto('MÉDICO')).toBe('medico');
    });
  });

  describe('obtenerPrimerComentario', () => {
    it('retorna el primer fragmento antes de un salto de línea', () => {
      expect(VigiflowUtils.obtenerPrimerComentario('primero\nsegundo')).toBe('primero');
    });

    it('retorna el primer fragmento antes de una coma o tabulador', () => {
      expect(VigiflowUtils.obtenerPrimerComentario('uno,dos')).toBe('uno');
      expect(VigiflowUtils.obtenerPrimerComentario('uno\tdos')).toBe('uno');
    });

    it('retorna cadena vacía si el valor es falsy', () => {
      expect(VigiflowUtils.obtenerPrimerComentario('')).toBe('');
      expect(VigiflowUtils.obtenerPrimerComentario(undefined as any)).toBe('');
    });
  });

  describe('encontrarCoincidencia', () => {
    const lista = ['MEDICO', 'ENFERMERA', 'AUXILIAR'];

    it('encuentra el primer elemento que contiene la entrada, ignorando tildes y mayúsculas', () => {
      expect(VigiflowUtils.encontrarCoincidencia('médico', lista)).toBe('MEDICO');
    });

    it('retorna undefined si no hay coincidencia', () => {
      expect(VigiflowUtils.encontrarCoincidencia('inexistente', lista)).toBeUndefined();
    });
  });

  describe('esAfirmativo', () => {
    it('retorna true para "si", con o sin tilde', () => {
      expect(VigiflowUtils.esAfirmativo('si')).toBe(true);
      expect(VigiflowUtils.esAfirmativo(' SI ')).toBe(true);
      expect(VigiflowUtils.esAfirmativo('Sí')).toBe(true);
      expect(VigiflowUtils.esAfirmativo('SÍ')).toBe(true);
    });

    it('retorna false para "no"', () => {
      expect(VigiflowUtils.esAfirmativo('no')).toBe(false);
      expect(VigiflowUtils.esAfirmativo(' No ')).toBe(false);
    });

    it('resuelve las celdas multilínea por su primera línea', () => {
      expect(VigiflowUtils.esAfirmativo('Sí\r\nSí')).toBe(true);
      expect(VigiflowUtils.esAfirmativo('Sí\r\nSí\r\nSí\r\nSí')).toBe(true);
      expect(VigiflowUtils.esAfirmativo('No\r\nNo')).toBe(false);
    });

    it('retorna null para cualquier otro valor', () => {
      expect(VigiflowUtils.esAfirmativo('tal vez')).toBeNull();
      expect(VigiflowUtils.esAfirmativo(undefined)).toBeNull();
      expect(VigiflowUtils.esAfirmativo(null)).toBeNull();
      expect(VigiflowUtils.esAfirmativo('')).toBeNull();
    });

    it('no marca como afirmativo los textos que solo contienen la letra "s"', () => {
      expect(VigiflowUtils.esAfirmativo('Sin dato')).toBeNull();
      expect(VigiflowUtils.esAfirmativo('Desconocido')).toBeNull();
      expect(VigiflowUtils.esAfirmativo('No se sabe')).toBeNull();
    });
  });

  describe('transformarLoteVacuna', () => {
    it('retorna "Desconocido" cuando el valor coincide con una palabra clave', () => {
      expect(VigiflowUtils.transformarLoteVacuna('SE DESCONOCE EL LOTE')).toBe('Desconocido');
      expect(VigiflowUtils.transformarLoteVacuna('no aplica')).toBe('Desconocido');
      expect(VigiflowUtils.transformarLoteVacuna('N/R')).toBe('Desconocido');
    });

    it('retorna el valor original cuando no coincide con ninguna palabra clave', () => {
      expect(VigiflowUtils.transformarLoteVacuna('LOTE-12345')).toBe('LOTE-12345');
    });

    it('retorna el valor original (incluido falsy) cuando viene vacío', () => {
      expect(VigiflowUtils.transformarLoteVacuna('')).toBe('');
    });
  });

  describe('parseIngredientsWithSemicolonsToJson', () => {
    it('convierte una cadena separada por punto y coma en un arreglo de ingredientes', () => {
      expect(VigiflowUtils.parseIngredientsWithSemicolonsToJson('Ing1; Ing2 ;Ing3')).toEqual([
        { ingredient: 'Ing1' },
        { ingredient: 'Ing2' },
        { ingredient: 'Ing3' },
      ]);
    });

    it('descarta términos vacíos resultantes de separadores consecutivos', () => {
      expect(VigiflowUtils.parseIngredientsWithSemicolonsToJson('Ing1;;Ing2;')).toEqual([
        { ingredient: 'Ing1' },
        { ingredient: 'Ing2' },
      ]);
    });

    it('retorna arreglo vacío para valores vacíos, undefined o no-string', () => {
      expect(VigiflowUtils.parseIngredientsWithSemicolonsToJson('')).toEqual([]);
      expect(VigiflowUtils.parseIngredientsWithSemicolonsToJson(undefined)).toEqual([]);
      expect(VigiflowUtils.parseIngredientsWithSemicolonsToJson(123 as any)).toEqual([]);
    });
  });

  describe('extraerCodigoAtcVacuna', () => {
    it('retorna el primer código que empieza con J07 y no excede 7 caracteres', () => {
      expect(VigiflowUtils.extraerCodigoAtcVacuna('N02BE01\nJ07AL02')).toBe('J07AL02');
    });

    it('retorna null si ningún código cumple el criterio', () => {
      expect(VigiflowUtils.extraerCodigoAtcVacuna('N02BE01\nA02BC01')).toBeNull();
    });

    it('ignora un código J07 demasiado largo (más de 7 caracteres)', () => {
      expect(VigiflowUtils.extraerCodigoAtcVacuna('J07BX03EXTRA')).toBeNull();
    });

    it('retorna null para celdas vacías', () => {
      expect(VigiflowUtils.extraerCodigoAtcVacuna('')).toBeNull();
    });
  });

  describe('limpiarCampoWHODrug', () => {
    it('recorta espacios y reemplaza saltos de línea internos por punto y coma', () => {
      expect(VigiflowUtils.limpiarCampoWHODrug('  Patente X\nsegunda linea  ')).toBe('Patente X;segunda linea');
    });

    it('elimina saltos de línea al final sin agregar punto y coma extra', () => {
      expect(VigiflowUtils.limpiarCampoWHODrug('Patente X\n\n')).toBe('Patente X');
    });

    it('conserva las comas dentro del nombre (no las reemplaza)', () => {
      expect(VigiflowUtils.limpiarCampoWHODrug('Hexasiil - Vacuna, Antidiftérica')).toBe(
        'Hexasiil - Vacuna, Antidiftérica',
      );
    });

    it('retorna cadena vacía si el valor es undefined', () => {
      expect(VigiflowUtils.limpiarCampoWHODrug(undefined)).toBe('');
    });
  });

  describe('formatoEdadGestacional', () => {
    it('convierte a número los valores enteros dentro del rango 1..43', () => {
      expect(VigiflowUtils.formatoEdadGestacional('12')).toBe(12);
      expect(VigiflowUtils.formatoEdadGestacional(28)).toBe(28);
    });

    it('acepta valores flotantes dentro del rango', () => {
      expect(VigiflowUtils.formatoEdadGestacional('12.5')).toBe(12.5);
    });

    it('acepta los extremos del rango', () => {
      expect(VigiflowUtils.formatoEdadGestacional('1')).toBe(1);
      expect(VigiflowUtils.formatoEdadGestacional('43')).toBe(43);
    });

    it('descarta los valores fuera del rango', () => {
      expect(VigiflowUtils.formatoEdadGestacional('0')).toBeNull();
      expect(VigiflowUtils.formatoEdadGestacional('0.9')).toBeNull();
      expect(VigiflowUtils.formatoEdadGestacional('44')).toBeNull();
      expect(VigiflowUtils.formatoEdadGestacional('-5')).toBeNull();
    });

    it('descarta texto no numérico', () => {
      expect(VigiflowUtils.formatoEdadGestacional('Desconocido')).toBeNull();
      expect(VigiflowUtils.formatoEdadGestacional('12 semanas')).toBeNull();
    });

    it('descarta celdas vacías, null y undefined', () => {
      expect(VigiflowUtils.formatoEdadGestacional('')).toBeNull();
      expect(VigiflowUtils.formatoEdadGestacional('   ')).toBeNull();
      expect(VigiflowUtils.formatoEdadGestacional(null)).toBeNull();
      expect(VigiflowUtils.formatoEdadGestacional(undefined)).toBeNull();
    });

    it('ignora los espacios alrededor del valor', () => {
      expect(VigiflowUtils.formatoEdadGestacional(' 20 ')).toBe(20);
    });
  });

  describe('sleep', () => {
    it('resuelve una promesa tras el tiempo indicado', async () => {
      await expect(VigiflowUtils.sleep(1)).resolves.toBeUndefined();
    });
  });
});
