import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { IngredientTranslation } from '../models/ingredientTranslation.entity';
import { Maholder } from '../models/maholder.entity';
import { IngredientTranslationService } from './ingredientsTraslations.service';

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

  /*
   * Estrategia de codificación: una sola consulta por principio activo, y el desempate
   * resuelto en memoria sobre esas filas. Lo que se comprueba aquí es la cadena de
   * decisión; el parecido de trigramas tiene sus propias pruebas.
   */
  describe('buscarCodificacionVacuna', () => {
    let qb: any;

    const fila = (over: Record<string, any> = {}) => ({
      drugCode: 'DRU123',
      drugName: 'Gardasil 9',
      medicinalProductId: 111,
      maHolder: 'Merck sharp & dohme',
      maHolderMedicinalProductId: 555,
      ...over,
    });

    const esperado = (over: Record<string, any> = {}) => ({
      drugCode: 'DRU123',
      drugName: 'Gardasil 9',
      medicinalProductId: '111',
      maHolder: 'Merck sharp & dohme',
      maHolderMedicinalProductId: '555',
      ...over,
    });

    beforeEach(() => {
      qb = {
        distinct: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };
      (ingredientTranslationRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);
    });

    it('compara el principio activo con LIKE insensible a mayúsculas y TRIM a ambos lados', async () => {
      qb.getRawMany.mockResolvedValueOnce([fila()]);

      await service.buscarCodificacionVacuna('  Vacuna antiVPH VLP rL1 9v (levadura)  ', null, null);

      expect(qb.where).toHaveBeenCalledWith(
        'UPPER(TRIM(t.ingredient)) LIKE UPPER(TRIM(:ingrediente))',
        { ingrediente: 'Vacuna antiVPH VLP rL1 9v (levadura)' },
      );
    });

    it('aplica la única candidata cuando la consulta devuelve una', async () => {
      qb.getRawMany.mockResolvedValueOnce([fila()]);

      expect(await service.buscarCodificacionVacuna('Ingrediente', 'Merck', 'Gardasil 9')).toEqual(
        esperado(),
      );
    });

    it('toma la de la posición 0 cuando devuelve dos, sin mirar laboratorio ni nombre', async () => {
      qb.getRawMany.mockResolvedValueOnce([fila(), fila({ drugCode: 'DRU999' })]);

      const result = await service.buscarCodificacionVacuna('Ingrediente', 'Nada que ver', 'Nada');

      expect(result).toEqual(esperado());
    });

    /*
     * Con tres o más candidatas entra el desempate. Se filtra primero por titular; si queda
     * una, esa es, y el nombre del medicamento ya no se mira.
     */
    it('con tres o más, filtra por titular y devuelve la única que supera el 0.6', async () => {
      qb.getRawMany.mockResolvedValueOnce([
        fila({ maHolder: 'Pfizer' }),
        fila({ maHolder: 'Merck Sharp & Dohme', drugCode: 'DRU777' }),
        fila({ maHolder: 'Sanofi Pasteur' }),
      ]);

      const result = await service.buscarCodificacionVacuna(
        'Ingrediente',
        'Merck Sharp & Dohme LLC',
        'Cualquier cosa',
      );

      expect(result).toEqual(esperado({ maHolder: 'Merck Sharp & Dohme', drugCode: 'DRU777' }));
    });

    it('descarta el registro si ninguna candidata supera el parecido de titular', async () => {
      qb.getRawMany.mockResolvedValueOnce([
        fila({ maHolder: 'Pfizer' }),
        fila({ maHolder: 'Sanofi Pasteur' }),
        fila({ maHolder: 'Bharat Biotech' }),
      ]);

      expect(
        await service.buscarCodificacionVacuna('Ingrediente', 'GlaxoSmithKline', 'X'),
      ).toBeNull();
    });

    it('si el titular deja dos o más, afina por nombre y toma la primera de las que quedan', async () => {
      qb.getRawMany.mockResolvedValueOnce([
        fila({ drugName: 'Gardasil 9', drugCode: 'DRU-A' }),
        fila({ drugName: 'Gardasil', drugCode: 'DRU-B' }),
        fila({ drugName: 'Silgard', drugCode: 'DRU-C' }),
      ]);

      const result = await service.buscarCodificacionVacuna(
        'Ingrediente',
        'Merck sharp & dohme',
        'Gardasil 9',
      );

      expect(result).toEqual(esperado({ drugName: 'Gardasil 9', drugCode: 'DRU-A' }));
    });

    /*
     * La regla explícita de la estrategia: con más de dos candidatas todavía indistinguibles
     * no se codifica, porque elegir una sería inventarse el dato.
     */
    it('descarta el registro si tras ambos filtros quedan más de dos candidatas', async () => {
      const tresIguales = [
        fila({ drugCode: 'DRU-A' }),
        fila({ drugCode: 'DRU-B' }),
        fila({ drugCode: 'DRU-C' }),
      ];
      qb.getRawMany.mockResolvedValueOnce(tresIguales);

      expect(
        await service.buscarCodificacionVacuna('Ingrediente', 'Merck sharp & dohme', 'Gardasil 9'),
      ).toBeNull();
    });

    it('descarta el registro si el nombre del medicamento no deja ninguna candidata', async () => {
      qb.getRawMany.mockResolvedValueOnce([
        fila({ drugName: 'Boostrix', drugCode: 'DRU-A' }),
        fila({ drugName: 'Infanrix', drugCode: 'DRU-B' }),
        fila({ drugName: 'Priorix', drugCode: 'DRU-C' }),
      ]);

      expect(
        await service.buscarCodificacionVacuna('Ingrediente', 'Merck sharp & dohme', 'Gardasil 9'),
      ).toBeNull();
    });

    it('devuelve null sin consultar cuando el principio activo viene vacío', async () => {
      expect(await service.buscarCodificacionVacuna('   ', 'Merck', 'Gardasil')).toBeNull();
      expect(ingredientTranslationRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    /*
     * Los dos MPID son numéricos en WHODrug y texto en TR_DATO_VACUNA. La comprobación no
     * puede ser por veracidad: el identificador 0 es válido y se perdería.
     */
    it('convierte los MPID a texto conservando el 0 y dejando null los ausentes', async () => {
      qb.getRawMany.mockResolvedValueOnce([
        fila({ medicinalProductId: 0, maHolderMedicinalProductId: null }),
      ]);

      const result = await service.buscarCodificacionVacuna('Ingrediente', null, null);

      expect(result.medicinalProductId).toBe('0');
      expect(result.maHolderMedicinalProductId).toBeNull();
    });

    /*
     * La columna F es multilínea: una vacuna combinada trae un principio activo por
     * renglón. Caso real EC-ARCSA-300078439, con seis componentes.
     */
    describe('columna F multilínea', () => {
      const SEIS_COMPONENTES = [
        'Vacuna toxoide diftérico',
        'Vacuna antihepatitis b rHBsAG',
        'Vacuna antiinfluenza tipo B conjugada (tet tox)',
        'Vacuna antipertussis acelular 2-componente',
        'Vacuna antipoliomielítica inactivada 3v (Vero)',
        'Vacuna toxoide tetánico',
      ].join('\n');

      it('consulta renglón a renglón y se queda con el primero que resuelve', async () => {
        qb.getRawMany
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([fila()]);

        const result = await service.buscarCodificacionVacuna(SEIS_COMPONENTES, 'Merck', 'Gardasil 9');

        expect(result).toEqual(esperado());
        // Tres renglones, no seis: en cuanto uno resuelve se deja de buscar.
        expect(ingredientTranslationRepository.createQueryBuilder).toHaveBeenCalledTimes(3);
        expect(qb.where).toHaveBeenNthCalledWith(
          3,
          'UPPER(TRIM(t.ingredient)) LIKE UPPER(TRIM(:ingrediente))',
          { ingrediente: 'Vacuna antiinfluenza tipo B conjugada (tet tox)' },
        );
      });

      it('recorre los seis renglones y devuelve null si ninguno resuelve', async () => {
        qb.getRawMany.mockResolvedValue([]);

        expect(await service.buscarCodificacionVacuna(SEIS_COMPONENTES, 'GSK', 'X')).toBeNull();
        expect(ingredientTranslationRepository.createQueryBuilder).toHaveBeenCalledTimes(6);
      });

      it('tolera saltos de línea de Windows y renglones en blanco', async () => {
        qb.getRawMany.mockResolvedValueOnce([fila()]);

        await service.buscarCodificacionVacuna('\r\n  \r\nVacuna toxoide tetánico\r\n\r\n', null, null);

        expect(ingredientTranslationRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(qb.where).toHaveBeenCalledWith(
          'UPPER(TRIM(t.ingredient)) LIKE UPPER(TRIM(:ingrediente))',
          { ingrediente: 'Vacuna toxoide tetánico' },
        );
      });

      /*
       * Sólo se corta por salto de línea. Partir además por coma rompería la comparación
       * en los ingredientes cuyo nombre la lleva.
       */
      it('no parte por coma: un ingrediente con coma viaja entero', async () => {
        qb.getRawMany.mockResolvedValueOnce([fila()]);

        await service.buscarCodificacionVacuna('Vacuna antitetánica, adsorbida', null, null);

        expect(ingredientTranslationRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(qb.where).toHaveBeenCalledWith(
          'UPPER(TRIM(t.ingredient)) LIKE UPPER(TRIM(:ingrediente))',
          { ingrediente: 'Vacuna antitetánica, adsorbida' },
        );
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
