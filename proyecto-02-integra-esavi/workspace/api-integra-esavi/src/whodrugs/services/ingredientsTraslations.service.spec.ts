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

    it('debe retornar el match con las 5 columnas planas cuando hay coincidencia', async () => {
      ingredientTranslationRepository.find.mockResolvedValue(traduccionesMock);
      queryBuilder.getOne.mockResolvedValue(maholderMock);

      const result = await service.findVaccineByIngredientAndMaholder('Vacuna Antigripal', 'Merck Sharp & Dohme LLC');

      expect(result).toEqual({
        drugCode: 'DRU123',
        drugName: 'GARDASIL 9',
        medicinalProductId: '111',
        maHolder: 'Merck sharp & dohme',
        maHolderMedicinalProductId: '555',
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

    it('debe retornar null (no "null" string) en los MPID cuando no existen en el diccionario', async () => {
      ingredientTranslationRepository.find.mockResolvedValue(traduccionesMock);
      queryBuilder.getOne.mockResolvedValue({
        ...maholderMock,
        medicinalProductID: null,
        countrySale: { ...maholderMock.countrySale, medicinalProductID: null },
      });

      const result = await service.findVaccineByIngredientAndMaholder('Vacuna Antigripal', 'Merck');

      expect(result.medicinalProductId).toBeNull();
      expect(result.maHolderMedicinalProductId).toBeNull();
      expect(result.drugCode).toBe('DRU123');
    });
  });
});
