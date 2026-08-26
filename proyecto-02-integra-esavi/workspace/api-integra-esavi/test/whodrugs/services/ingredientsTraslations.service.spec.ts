import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { IngredientTranslation } from 'src/whodrugs/models/ingredientTranslation.entity';
import { Maholder } from 'src/whodrugs/models/maholder.entity';
import { IngredientTranslationService } from 'src/whodrugs/services/ingredientsTraslations.service';

describe('IngredientTranslationService', () => {
  let service: IngredientTranslationService;
  let ingredientTranslationRepository: jest.Mocked<Repository<IngredientTranslation>>;
  let maholderRepository: jest.Mocked<Repository<Maholder>>;
  let queryBuilder: any;

  beforeEach(async () => {
    // QueryBuilder encadenable para el paso 2 (MAHOLDER).
    queryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientTranslationService,
        {
          provide: getRepositoryToken(IngredientTranslation, 'WHO_DRUG'),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Maholder, 'WHO_DRUG'),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get(IngredientTranslationService);
    ingredientTranslationRepository = module.get(getRepositoryToken(IngredientTranslation, 'WHO_DRUG'));
    maholderRepository = module.get(getRepositoryToken(Maholder, 'WHO_DRUG'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Composiciones de referencia, tomadas de casos reales del libro de VigiFlow.
  const SEIS_COMPONENTES = [
    'Vacuna toxoide diftérico',
    'Vacuna antihepatitis b rHBsAG',
    'Vacuna antiinfluenza tipo B conjugada (tet tox)',
    'Vacuna antipertussis acelular 2-componente',
    'Vacuna antipoliomielítica inactivada 3v (Vero)',
    'Vacuna toxoide tetánico',
  ].join('\n');
  const TRES_COMPONENTES = ['Difteria', 'Tetanos', 'Pertussis'].join('\n');
  const DOS_COMPONENTES = ['Difteria', 'Tetanos'].join('\n');

  /*
   * Estrategia de codificación en dos fases: una sola consulta con TODOS los principios
   * activos reportados, limitada a los medicamentos registrados en el país, y sobre esas
   * filas una cascada de criterios que estrechan pero nunca vacían. Lo que se comprueba aquí es la cadena de decisión; el parecido de
   * trigramas tiene sus propias pruebas.
   */
  describe('buscarCodificacionVacuna', () => {
    let qb: any;

    /**
     * Una fila del diccionario tal como la devuelve la consulta: un medicamento registrado
     * en el país pedido, con un titular. `cobertura` y `totalIngredientes` llegan como texto
     * porque COUNT devuelve bigint.
     */
    const fila = (over: Record<string, any> = {}) => ({
      drugCode: 'DRU123',
      drugName: 'Gardasil 9',
      paisRegistro: 'ECU',
      medicinalProductId: 111,
      maHolder: 'Merck sharp & dohme',
      maHolderMedicinalProductId: 555,
      cobertura: '1',
      totalIngredientes: '1',
      ...over,
    });

    beforeEach(() => {
      qb = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };
      (ingredientTranslationRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);
    });

    /*
     * La diferencia de fondo con la estrategia anterior: los seis renglones de una vacuna
     * combinada NO se consultan uno a uno, sino juntos, porque lo que identifica al producto
     * es el conjunto. Una sola consulta, no seis.
     */
    it('consulta los principios activos como conjunto, en una única consulta y normalizados', async () => {
      qb.getRawMany.mockResolvedValueOnce([fila()]);

      await service.buscarCodificacionVacuna('  Vacuna toxoide diftérico  \r\nVacuna toxoide tetánico\r\n', null, null);

      expect(ingredientTranslationRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(qb.where).toHaveBeenCalledWith('UPPER(TRIM(t.ingredient)) IN (:...ingredientes)', {
        ingredientes: ['VACUNA TOXOIDE DIFTÉRICO', 'VACUNA TOXOIDE TETÁNICO'],
      });
    });

    /*
     * La regla de negocio vive en la consulta: sólo entran medicamentos registrados en el
     * país del reporte y con sus dos MPID. Es lo que garantiza que una vacuna codificada
     * traiga siempre MEDICINAL_PRODUCT_ID y MA_HOLDER_MEDI_PROD_ID.
     */
    it('limita la búsqueda al país del reporte y a las filas con los dos MPID', async () => {
      qb.getRawMany.mockResolvedValueOnce([fila()]);

      await service.buscarCodificacionVacuna('Ingrediente', null, null);

      expect(qb.andWhere).toHaveBeenCalledWith('cs.iso3Code = :pais', { pais: 'ECU' });
      expect(qb.andWhere).toHaveBeenCalledWith('cs.medicinalProductID IS NOT NULL');
      expect(qb.andWhere).toHaveBeenCalledWith('m.medicinalProductID IS NOT NULL');
    });

    it('devuelve null sin consultar cuando la columna F viene vacía', async () => {
      expect(await service.buscarCodificacionVacuna('   ', 'Merck', 'Gardasil')).toBeNull();
      expect(ingredientTranslationRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('devuelve null cuando ningún principio activo existe en el diccionario', async () => {
      qb.getRawMany.mockResolvedValueOnce([]);
      expect(await service.buscarCodificacionVacuna('Inexistente', 'Merck', 'Gardasil')).toBeNull();
    });

    /*
     * Caso real EC-ARCSA-300078352: Hexaxim con seis principios activos, titular «Sanofi
     * Aventis» y nombre «Hexaxim». Los tres criterios corroboran y la codificación sale
     * entera, con los identificadores del registro ecuatoriano.
     */
    it('codifica la combinada cuando nombre, titular y composición coinciden', async () => {
      qb.getRawMany.mockResolvedValueOnce([
        fila({ drugCode: 'HEXAXIM', drugName: 'Hexaxim', maHolder: 'Sanofi aventis',
               medicinalProductId: 5071627, maHolderMedicinalProductId: 5071626,
               cobertura: '6', totalIngredientes: '6' }),
        fila({ drugCode: 'OTRO', drugName: 'Tetracoq', maHolder: 'Sanofi aventis pas',
               cobertura: '3', totalIngredientes: '4' }),
      ]);

      const result = await service.buscarCodificacionVacuna(SEIS_COMPONENTES, 'Sanofi Aventis', 'Hexaxim');

      expect(result).toMatchObject({
        drugCode: 'HEXAXIM',
        drugName: 'Hexaxim',
        medicinalProductId: '5071627',
        maHolder: 'Sanofi aventis',
        maHolderMedicinalProductId: '5071626',
        paisRegistro: 'ECU',
        cobertura: 6,
        principiosReportados: 6,
      });
    });

    /*
     * El filtro de titular estrecha pero no vacía. Hexaxim se reporta a menudo como «Sanofi
     * Pasteur» mientras que en ECU figura a nombre de «Sanofi aventis»: si un titular que no
     * casa con nadie descartara el resultado, se perderían 7 de las 8 filas de Hexaxim del
     * libro real.
     */
    it('ignora el titular reportado cuando no se parece a ninguno, en vez de descartar', async () => {
      qb.getRawMany.mockResolvedValueOnce([
        fila({ drugCode: 'HEXAXIM', drugName: 'Hexaxim', maHolder: 'Sanofi aventis',
               medicinalProductId: 5071627, maHolderMedicinalProductId: 5071626,
               cobertura: '6', totalIngredientes: '6' }),
      ]);

      const result = await service.buscarCodificacionVacuna(SEIS_COMPONENTES, 'Sanofi Pasteur', 'Hexaxim');

      expect(result?.drugCode).toBe('HEXAXIM');
      expect(result?.maHolder).toBe('Sanofi aventis');
      expect(result?.criterios).not.toContain('laboratorio titular (col I)');
    });

    /*
     * La composición exacta es lo que separa la combinada del producto que la contiene:
     * Tetracoq cubre los tres componentes de una DTP pero además lleva polio, así que no es
     * la reportada.
     */
    it('prefiere la composición exacta sobre la que solo contiene los principios reportados', async () => {
      qb.getRawMany.mockResolvedValueOnce([
        fila({ drugCode: 'TETRACOQ', drugName: 'Tetracoq', cobertura: '3', totalIngredientes: '4' }),
        fila({ drugCode: 'DTP', drugName: 'Dtp', cobertura: '3', totalIngredientes: '3' }),
      ]);

      const result = await service.buscarCodificacionVacuna(TRES_COMPONENTES, null, null);

      expect(result?.drugCode).toBe('DTP');
      expect(result?.criterios).toContain('composición exacta');
    });

    /*
     * Regla explícita: con varios medicamentos distintos todavía empatados no se codifica,
     * porque elegir uno sería inventarse el dato. La vacuna conserva su
     * NOMBRE_VACUNA_REPORTADO, que sigue siendo homologable después.
     */
    it('no codifica cuando quedan varios medicamentos distintos empatados', async () => {
      qb.getRawMany.mockResolvedValueOnce([
        fila({ drugCode: 'DRU-A', drugName: 'Uno', cobertura: '2', totalIngredientes: '2' }),
        fila({ drugCode: 'DRU-B', drugName: 'Dos', cobertura: '2', totalIngredientes: '2' }),
      ]);

      expect(await service.buscarCodificacionVacuna(DOS_COMPONENTES, null, null)).toBeNull();
    });

    /*
     * Una cobertura parcial, por sí sola, empareja cualquier vacuna que comparta un
     * componente con la reportada. Sin nombre, titular ni composición que corroboren, no
     * basta para escribir un DRUG_CODE.
     */
    it('no codifica si sólo la sostiene una cobertura parcial, sin corroboración', async () => {
      qb.getRawMany.mockResolvedValueOnce([
        fila({ drugCode: 'PARCIAL', drugName: 'Otra cosa', maHolder: 'Nadie',
               cobertura: '1', totalIngredientes: '5' }),
      ]);

      expect(await service.buscarCodificacionVacuna(TRES_COMPONENTES, 'Bio Farma', 'Dtp vaccine')).toBeNull();
    });

    /*
     * Caso real EC-ARCSA-300079062: «BE Td» de Biological E, que WHODrug sólo registra para
     * SLV. Antes se codificaba con su DRUG_CODE y los tres identificadores de registro en
     * null; ahora la consulta ni siquiera lo devuelve —está fuera del país— y la vacuna se
     * queda sin codificar, conservando su NOMBRE_VACUNA_REPORTADO. Media codificación no
     * vale más que ninguna.
     */
    it('no codifica la vacuna que no está registrada en el país', async () => {
      qb.getRawMany.mockResolvedValueOnce([]);

      const result = await service.buscarCodificacionVacuna(DOS_COMPONENTES, 'Biological E. Limited', 'BE Td');

      expect(result).toBeNull();
    });

    /*
     * El contrato que se pide cumplir: si sale DRUG_CODE, salen también los dos MPID y el
     * titular. No hay camino que devuelva unos sin los otros.
     */
    it('devuelve los dos MPID siempre que identifica el DRUG_CODE', async () => {
      qb.getRawMany.mockResolvedValueOnce([
        fila({ drugCode: 'DTP', drugName: 'Dtp', medicinalProductId: 6885172,
               maHolder: 'Biological E.', maHolderMedicinalProductId: 6885171,
               cobertura: '2', totalIngredientes: '2' }),
      ]);

      const result = await service.buscarCodificacionVacuna(DOS_COMPONENTES, 'Biological E. Limited', 'Dtp');

      expect(result.drugCode).toBe('DTP');
      expect(result.medicinalProductId).toBe('6885172');
      expect(result.maHolderMedicinalProductId).toBe('6885171');
      expect(result.maHolder).toBe('Biological E.');
      expect(result.paisRegistro).toBe('ECU');
    });

    /*
     * Fase 2: el registro se busca entre TODAS las filas del medicamento, no sólo entre las
     * que sobrevivieron a los filtros, y entre varios titulares del país gana el más parecido
     * al reportado.
     */
    it('elige, entre los titulares del país, el más parecido al reportado', async () => {
      qb.getRawMany.mockResolvedValueOnce([
        fila({ drugCode: 'HEXAXIM', drugName: 'Hexaxim', maHolder: 'Sanofi Winthrop Industrie',
               medicinalProductId: 5071627, maHolderMedicinalProductId: 6873373,
               cobertura: '6', totalIngredientes: '6' }),
        fila({ drugCode: 'HEXAXIM', drugName: 'Hexaxim', maHolder: 'Sanofi aventis',
               medicinalProductId: 5071627, maHolderMedicinalProductId: 5071626,
               cobertura: '6', totalIngredientes: '6' }),
      ]);

      const result = await service.buscarCodificacionVacuna(SEIS_COMPONENTES, 'Sanofi Aventis', 'Hexaxim');

      expect(result?.maHolder).toBe('Sanofi aventis');
      expect(result?.maHolderMedicinalProductId).toBe('5071626');
    });

    it('respeta el país pedido, tanto al consultar como al resolver el registro', async () => {
      qb.getRawMany.mockResolvedValueOnce([
        fila({ drugCode: 'X', drugName: 'Equis', paisRegistro: 'PER', medicinalProductId: 3,
               maHolderMedicinalProductId: 4, cobertura: '1', totalIngredientes: '1' }),
      ]);

      const result = await service.buscarCodificacionVacuna('Ingrediente', 'Merck sharp & dohme', 'Equis', 'PER');

      expect(qb.andWhere).toHaveBeenCalledWith('cs.iso3Code = :pais', { pais: 'PER' });
      expect(result?.paisRegistro).toBe('PER');
      expect(result?.medicinalProductId).toBe('3');
    });

    /*
     * Los dos MPID son numéricos en WHODrug y texto en TR_DATO_VACUNA. La comprobación no
     * puede ser por veracidad: el identificador 0 es válido y se perdería. Ya no se prueba
     * el caso nulo porque la consulta descarta esas filas.
     */
    it('convierte los MPID a texto conservando el 0', async () => {
      qb.getRawMany.mockResolvedValueOnce([
        fila({ medicinalProductId: 0, maHolderMedicinalProductId: 0 }),
      ]);

      const result = await service.buscarCodificacionVacuna('Ingrediente', 'Merck sharp & dohme', 'Gardasil 9');

      expect(result.medicinalProductId).toBe('0');
      expect(result.maHolderMedicinalProductId).toBe('0');
    });

    describe('separación de la columna F', () => {
      it('tolera saltos de línea de Windows y renglones en blanco', async () => {
        qb.getRawMany.mockResolvedValueOnce([fila()]);

        await service.buscarCodificacionVacuna('\r\n  \r\nVacuna toxoide tetánico\r\n\r\n', null, null);

        expect(qb.where).toHaveBeenCalledWith('UPPER(TRIM(t.ingredient)) IN (:...ingredientes)', {
          ingredientes: ['VACUNA TOXOIDE TETÁNICO'],
        });
      });

      /*
       * Sólo se corta por salto de línea. Partir además por coma rompería la comparación
       * en los ingredientes cuyo nombre la lleva.
       */
      it('no parte por coma: un ingrediente con coma viaja entero', async () => {
        qb.getRawMany.mockResolvedValueOnce([fila()]);

        await service.buscarCodificacionVacuna('Vacuna antitetánica, adsorbida', null, null);

        expect(qb.where).toHaveBeenCalledWith('UPPER(TRIM(t.ingredient)) IN (:...ingredientes)', {
          ingredientes: ['VACUNA ANTITETÁNICA, ADSORBIDA'],
        });
      });
    });
  });


  describe('findVaccineByIngredientAndMaholder', () => {
    const traduccionesMock = [
      { id: 1, activeIngredient: { id: 'AI1', drug: { id: 'DRUG-00001' } } },
      { id: 2, activeIngredient: { id: 'AI2', drug: { id: 'DRUG-00002' } } },
      // Duplicado intencional: el servicio debe deduplicar los DRUG.ID.
      { id: 3, activeIngredient: { id: 'AI3', drug: { id: 'DRUG-00001' } } },
    ] as any[];

    const maholderMock = {
      id: 'MAH-1',
      name: 'Merck sharp & dohme',
      medicinalProductID: 555,
      countrySale: {
        id: 'COS-1',
        medicinalProductID: 111,
        drug: { id: 'DRUG-00001', drugCode: 'DRU123', drugName: 'GARDASIL 9' },
      },
    } as any;

    it('debe retornar null si el ingrediente es vacío o solo espacios', async () => {
      expect(await service.findVaccineByIngredientAndMaholder('', 'Pfizer')).toBeNull();
      expect(await service.findVaccineByIngredientAndMaholder('   ', 'Pfizer')).toBeNull();
      expect(await service.findVaccineByIngredientAndMaholder(null, 'Pfizer')).toBeNull();
      expect(ingredientTranslationRepository.find).not.toHaveBeenCalled();
    });

    it('debe retornar null si el laboratorio titular es vacío o solo espacios', async () => {
      expect(await service.findVaccineByIngredientAndMaholder('Vacuna antigripal', '')).toBeNull();
      expect(await service.findVaccineByIngredientAndMaholder('Vacuna antigripal', '  ')).toBeNull();
      expect(await service.findVaccineByIngredientAndMaholder('Vacuna antigripal', undefined)).toBeNull();
      expect(ingredientTranslationRepository.find).not.toHaveBeenCalled();
    });

    it('debe retornar null si no existe traducción del principio activo', async () => {
      ingredientTranslationRepository.find.mockResolvedValue([]);

      const result = await service.findVaccineByIngredientAndMaholder('Inexistente', 'Pfizer');

      expect(result).toBeNull();
      expect(maholderRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('debe buscar la traducción con ILike (insensible a mayúsculas) y solo registros habilitados/activos', async () => {
      ingredientTranslationRepository.find.mockResolvedValue([]);

      await service.findVaccineByIngredientAndMaholder('  Vacuna Antigripal  ', 'Pfizer');

      expect(ingredientTranslationRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ingredient: ILike('Vacuna Antigripal'),
            isEnabled: true,
            isActive: true,
          },
        }),
      );
    });

    it('debe retornar null si ningún MAHOLDER coincide con el laboratorio en el país', async () => {
      ingredientTranslationRepository.find.mockResolvedValue(traduccionesMock);
      queryBuilder.getOne.mockResolvedValue(null);

      const result = await service.findVaccineByIngredientAndMaholder('Vacuna Antigripal', 'Laboratorio Desconocido');

      expect(result).toBeNull();
    });

    /*
     * El match devolvía cinco columnas planas; ahora sólo dos. `toEqual` es deliberado
     * frente a `toMatchObject`: lo que esta prueba sujeta es que DRUG_CODE y los dos MPID
     * *no* vuelvan por este camino mientras se rehace su identificación.
     */
    it('debe retornar solo el nombre estandarizado y el titular cuando hay coincidencia', async () => {
      ingredientTranslationRepository.find.mockResolvedValue(traduccionesMock);
      queryBuilder.getOne.mockResolvedValue(maholderMock);

      const result = await service.findVaccineByIngredientAndMaholder('Vacuna Antigripal', 'Merck Sharp & Dohme LLC');

      expect(result).toEqual({
        drugName: 'GARDASIL 9',
        maHolder: 'Merck sharp & dohme',
      });
    });

    it('debe deduplicar los DRUG.ID y filtrar por país de venta', async () => {
      ingredientTranslationRepository.find.mockResolvedValue(traduccionesMock);
      queryBuilder.getOne.mockResolvedValue(maholderMock);

      await service.findVaccineByIngredientAndMaholder('Vacuna Antigripal', 'Merck', 'ECU');

      expect(queryBuilder.where).toHaveBeenCalledWith('cs.iso3Code = :country', { country: 'ECU' });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('d.ID IN (:...drugIds)', {
        drugIds: ['DRUG-00001', 'DRUG-00002'],
      });
    });

    it('debe usar coincidencia "contiene" bidireccional para el nombre del laboratorio', async () => {
      ingredientTranslationRepository.find.mockResolvedValue(traduccionesMock);
      queryBuilder.getOne.mockResolvedValue(maholderMock);

      await service.findVaccineByIngredientAndMaholder('Vacuna Antigripal', 'Merck Sharp & Dohme LLC');

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        "(m.NAME ILIKE '%' || :maholder || '%' OR :maholder ILIKE '%' || m.NAME || '%')",
        { maholder: 'Merck Sharp & Dohme LLC' },
      );
    });

    /*
     * Sustituye a la prueba que comprobaba que los MPID ausentes salieran como `null` y no
     * como la cadena "null". Ya no hay MPID que devolver: lo que interesa comprobar es que
     * su ausencia en el diccionario no rompe el resto del match.
     */
    it('debe resolver el match aunque el titular no tenga MPID en el diccionario', async () => {
      ingredientTranslationRepository.find.mockResolvedValue(traduccionesMock);
      queryBuilder.getOne.mockResolvedValue({
        ...maholderMock,
        medicinalProductID: null,
        countrySale: { ...maholderMock.countrySale, medicinalProductID: null },
      });

      const result = await service.findVaccineByIngredientAndMaholder('Vacuna Antigripal', 'Merck');

      expect(result).toEqual({ drugName: 'GARDASIL 9', maHolder: 'Merck sharp & dohme' });
    });
  });
});
