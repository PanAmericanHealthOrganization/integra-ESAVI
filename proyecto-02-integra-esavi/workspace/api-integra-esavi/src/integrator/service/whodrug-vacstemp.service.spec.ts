import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WhodrugVacsTempService } from './whodrug-vacstemp.service';
import { WhodrugVacsTemp } from '../entity/whodrug-vacstemp.entity';

const mockWhodrugVacsTempRepo = {
  find: jest.fn(),
};

describe('WhodrugVacsTempService', () => {
  let service: WhodrugVacsTempService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhodrugVacsTempService,
        { provide: getRepositoryToken(WhodrugVacsTemp, 'POSTGRES_INTEGRATOR_DS'), useValue: mockWhodrugVacsTempRepo },
      ],
    }).compile();
    service = module.get<WhodrugVacsTempService>(WhodrugVacsTempService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVaccinesByName', () => {
    it('retorna todos los registros en mayúsculas cuando no se especifica nombre', async () => {
      mockWhodrugVacsTempRepo.find.mockResolvedValue([
        { drugName: 'paracetamol' },
        { drugName: 'ibuprofeno' },
      ]);

      const result = await service.getVaccinesByName(undefined as any);

      expect(result).toEqual([{ drugName: 'PARACETAMOL' }, { drugName: 'IBUPROFENO' }]);
    });

    it('filtra por coincidencia exacta de nombre (case-insensitive)', async () => {
      mockWhodrugVacsTempRepo.find.mockResolvedValue([
        { drugName: 'paracetamol' },
        { drugName: 'ibuprofeno' },
      ]);

      const result = await service.getVaccinesByName('IBUPROFENO');

      expect(result).toEqual([{ drugName: 'IBUPROFENO' }]);
    });

    it('retorna arreglo vacío si no hay coincidencias', async () => {
      mockWhodrugVacsTempRepo.find.mockResolvedValue([{ drugName: 'paracetamol' }]);
      const result = await service.getVaccinesByName('novacuna');
      expect(result).toEqual([]);
    });
  });

  describe('getVaccinesByNameAndIso3CodeNull', () => {
    it('filtra por countryIso3Code nulo y nombre exacto', async () => {
      mockWhodrugVacsTempRepo.find.mockResolvedValue([{ drugName: 'bcg', countryIso3Code: null }]);

      const result = await service.getVaccinesByNameAndIso3CodeNull('BCG');

      expect(mockWhodrugVacsTempRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { countryIso3Code: expect.anything() } }),
      );
      expect(result).toEqual([{ drugName: 'BCG', countryIso3Code: null }]);
    });

    it('retorna todos en mayúsculas si no se especifica nombre', async () => {
      mockWhodrugVacsTempRepo.find.mockResolvedValue([{ drugName: 'bcg' }]);
      const result = await service.getVaccinesByNameAndIso3CodeNull(undefined as any);
      expect(result).toEqual([{ drugName: 'BCG' }]);
    });
  });

  describe('getVaccinesByActiveIngredient', () => {
    it('filtra por principio activo exacto', async () => {
      mockWhodrugVacsTempRepo.find.mockResolvedValue([
        { activeIngredient: 'paracetamol' },
        { activeIngredient: 'ibuprofeno' },
      ]);

      const result = await service.getVaccinesByActiveIngredient('PARACETAMOL');

      expect(result).toEqual([{ activeIngredient: 'PARACETAMOL' }]);
    });

    it('retorna todos en mayúsculas si no se especifica principio activo', async () => {
      mockWhodrugVacsTempRepo.find.mockResolvedValue([{ activeIngredient: 'paracetamol' }]);
      const result = await service.getVaccinesByActiveIngredient(undefined as any);
      expect(result).toEqual([{ activeIngredient: 'PARACETAMOL' }]);
    });
  });

  describe('getVaccsByActiveIngredientAndIso3CodeNull', () => {
    it('filtra por countryIso3Code nulo', async () => {
      mockWhodrugVacsTempRepo.find.mockResolvedValue([{ activeIngredient: 'paracetamol' }]);

      const result = await service.getVaccsByActiveIngredientAndIso3CodeNull('PARACETAMOL');

      expect(mockWhodrugVacsTempRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { countryIso3Code: expect.anything() } }),
      );
      expect(result).toEqual([{ activeIngredient: 'PARACETAMOL' }]);
    });
  });

  describe('getVaccinesByActIngTranslation', () => {
    it('filtra por traducción de principio activo exacta', async () => {
      mockWhodrugVacsTempRepo.find.mockResolvedValue([
        { actiIngredientTranslation: 'traduccion1' },
        { actiIngredientTranslation: 'traduccion2' },
      ]);

      const result = await service.getVaccinesByActIngTranslation('TRADUCCION2');

      expect(result).toEqual([{ actiIngredientTranslation: 'TRADUCCION2' }]);
    });
  });

  describe('getVaccsByActIngTranslationAndIso3CodeNull', () => {
    it('filtra por countryIso3Code nulo', async () => {
      mockWhodrugVacsTempRepo.find.mockResolvedValue([{ actiIngredientTranslation: 'traduccion1' }]);

      const result = await service.getVaccsByActIngTranslationAndIso3CodeNull('TRADUCCION1');

      expect(mockWhodrugVacsTempRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { countryIso3Code: expect.anything() } }),
      );
      expect(result).toEqual([{ actiIngredientTranslation: 'TRADUCCION1' }]);
    });
  });
});
