import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SyncService } from 'src/integrator/service/sync.service';
import { ActiveIngredient } from '../models/activeIngredient.entity';
import { AnatomicalTherapeuticChemical } from '../models/atomicTerapeutalChemical.entity';
import { CountryOfSale } from '../models/countryOfSale.entity';
import { Drug } from '../models/drug.entity';
import { DrugSync } from '../models/drugSync.entity';
import { IDrugResponse } from '../models/dtos';
import { IngredientTranslation } from '../models/ingredientTranslation.entity';
import { Maholder } from '../models/maholder.entity';
import { WhoDrugsClientService } from './whodrugs-client.service';
import { WhoDrugsSyncService } from './whodrugs-sync.service';

describe('WhoDrugsSyncService', () => {
  let service: WhoDrugsSyncService;
  let whoDrugsClientService: any;
  let drugRepository: any;
  let drugSyncRepository: any;
  let activeIngredientsRepository: any;
  let ingredientTranslationRepository: any;
  let countrySaleRepository: any;
  let anatomicalTherapeuticChemicalRepository: any;
  let maholderRepository: any;
  let syncService: any;

  const makeDrugResponse = (overrides: Partial<IDrugResponse> = {}): IDrugResponse => ({
    drugCode: 'DRU001',
    drugName: 'GARDASIL 9',
    medicinalProductID: 1,
    isGeneric: false,
    isPreferred: true,
    activeIngredients: [],
    countryOfSales: [],
    atcs: [],
    ...overrides,
  });

  beforeEach(async () => {
    whoDrugsClientService = { getDrugs: jest.fn() };
    drugRepository = { save: jest.fn(), createQueryBuilder: jest.fn(), manager: { connection: {} } };
    drugSyncRepository = { save: jest.fn(), count: jest.fn(), findAndCount: jest.fn(), createQueryBuilder: jest.fn() };
    activeIngredientsRepository = { save: jest.fn(), createQueryBuilder: jest.fn() };
    ingredientTranslationRepository = { save: jest.fn(), createQueryBuilder: jest.fn() };
    countrySaleRepository = { save: jest.fn(), createQueryBuilder: jest.fn() };
    anatomicalTherapeuticChemicalRepository = { save: jest.fn(), createQueryBuilder: jest.fn() };
    maholderRepository = { save: jest.fn(), createQueryBuilder: jest.fn() };
    // Ejecuta el proceso directamente y propaga el resultado (equivalente a SyncService real).
    syncService = { ejecutarConRegistro: jest.fn(async (_name: string, proceso: () => Promise<any>) => proceso()) };

    // Todas las llamadas a createQueryBuilder() usadas en disableEntities/updateEntitiesStates
    const chainable: any = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
    };
    [
      drugRepository,
      drugSyncRepository,
      activeIngredientsRepository,
      ingredientTranslationRepository,
      countrySaleRepository,
      anatomicalTherapeuticChemicalRepository,
      maholderRepository,
    ].forEach((repo) => repo.createQueryBuilder.mockReturnValue(chainable));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhoDrugsSyncService,
        { provide: WhoDrugsClientService, useValue: whoDrugsClientService },
        { provide: getRepositoryToken(Drug, 'WHO_DRUG'), useValue: drugRepository },
        { provide: getRepositoryToken(DrugSync, 'WHO_DRUG'), useValue: drugSyncRepository },
        { provide: getRepositoryToken(ActiveIngredient, 'WHO_DRUG'), useValue: activeIngredientsRepository },
        { provide: getRepositoryToken(IngredientTranslation, 'WHO_DRUG'), useValue: ingredientTranslationRepository },
        { provide: getRepositoryToken(CountryOfSale, 'WHO_DRUG'), useValue: countrySaleRepository },
        {
          provide: getRepositoryToken(AnatomicalTherapeuticChemical, 'WHO_DRUG'),
          useValue: anatomicalTherapeuticChemicalRepository,
        },
        { provide: getRepositoryToken(Maholder, 'WHO_DRUG'), useValue: maholderRepository },
        { provide: SyncService, useValue: syncService },
      ],
    }).compile();

    service = module.get<WhoDrugsSyncService>(WhoDrugsSyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── sync ────────────────────────────────────────────────────────────────

  describe('sync', () => {
    it('no procesa nada si el SHA-256 ya está sincronizado (sin cambios)', async () => {
      whoDrugsClientService.getDrugs.mockResolvedValue([makeDrugResponse()]);
      drugSyncRepository.count.mockResolvedValue(1);

      await service.sync();

      expect(drugSyncRepository.save).not.toHaveBeenCalled();
      expect(drugRepository.save).not.toHaveBeenCalled();
    });

    it('sincroniza y guarda todas las entidades cuando hay una nueva versión', async () => {
      const drugResponse = makeDrugResponse({
        activeIngredients: [
          { ingredient: 'PARACETAMOL', ingredientTranslations: [{ languageCode: 'es', ingredient: 'PARACETAMOL' }] },
        ],
        countryOfSales: [
          { iso3Code: 'ECU', medicinalProductID: 1, maHolders: [{ name: 'MERCK', medicinalProductID: 10 }] },
        ],
        atcs: [{ code: 'J07BM03', text: 'HPV vaccine', officialFlag: 'Y' }],
      });
      whoDrugsClientService.getDrugs.mockResolvedValue([drugResponse]);
      drugSyncRepository.count.mockResolvedValue(0);
      drugSyncRepository.save.mockImplementation((entity) => Promise.resolve({ ...entity, id: 'SYNC-1' }));
      drugRepository.save.mockImplementation((entities) => Promise.resolve(entities));
      activeIngredientsRepository.save.mockImplementation((entities) => Promise.resolve(entities));
      ingredientTranslationRepository.save.mockImplementation((entities) => Promise.resolve(entities));
      countrySaleRepository.save.mockImplementation((entities) => Promise.resolve(entities));
      maholderRepository.save.mockImplementation((entities) => Promise.resolve(entities));
      anatomicalTherapeuticChemicalRepository.save.mockImplementation((entities) => Promise.resolve(entities));

      await service.sync();

      expect(drugRepository.save).toHaveBeenCalled();
      expect(activeIngredientsRepository.save).toHaveBeenCalled();
      expect(ingredientTranslationRepository.save).toHaveBeenCalled();
      expect(countrySaleRepository.save).toHaveBeenCalled();
      expect(maholderRepository.save).toHaveBeenCalled();
      expect(anatomicalTherapeuticChemicalRepository.save).toHaveBeenCalled();
      // Se guarda dos veces el DrugSync: al crearlo y al finalizarlo (FINISHED)
      expect(drugSyncRepository.save).toHaveBeenCalledTimes(2);
      const finalSyncSave = drugSyncRepository.save.mock.calls[1][0];
      expect(finalSyncSave.syncStatus).toBe('FINISHED');
    });

    it('propaga el error si falla la descarga de WHODrug', async () => {
      whoDrugsClientService.getDrugs.mockRejectedValue(new Error('conexión rechazada'));

      await expect(service.sync()).rejects.toThrow('conexión rechazada');
    });
  });

  // ─── existNewVersion ─────────────────────────────────────────────────────

  describe('existNewVersion', () => {
    it('retorna true si hay una nueva versión disponible', async () => {
      whoDrugsClientService.getDrugs.mockResolvedValue([makeDrugResponse()]);
      drugSyncRepository.count.mockResolvedValue(0);

      expect(await service.existNewVersion()).toBe(true);
    });

    it('retorna false si no hay cambios', async () => {
      whoDrugsClientService.getDrugs.mockResolvedValue([makeDrugResponse()]);
      drugSyncRepository.count.mockResolvedValue(1);

      expect(await service.existNewVersion()).toBe(false);
    });

    it('retorna false (sin lanzar) si ocurre un error consultando la nueva versión', async () => {
      whoDrugsClientService.getDrugs.mockRejectedValue(new Error('parámetro no configurado'));

      expect(await service.existNewVersion()).toBe(false);
    });
  });

  // ─── listSyncs ───────────────────────────────────────────────────────────

  describe('listSyncs', () => {
    it('retorna la lista paginada con skip/take y orden DESC', async () => {
      const data = [{ id: 'SYNC-1' }];
      drugSyncRepository.findAndCount.mockResolvedValue([data, 1]);

      const result = await service.listSyncs(1, 20);

      expect(drugSyncRepository.findAndCount).toHaveBeenCalledWith({
        order: { startSyncDate: 'DESC' },
        skip: 20,
        take: 20,
      });
      expect(result).toEqual({ data, total: 1 });
    });
  });

  // ─── saveEntitiesGeneric ─────────────────────────────────────────────────

  describe('saveEntitiesGeneric', () => {
    it('guarda las entidades en un solo lote cuando no superan el tamaño de página', async () => {
      const entities = [{ id: '1' }, { id: '2' }] as any[];
      drugRepository.save.mockImplementation((batch) => Promise.resolve(batch));

      const result = await service.saveEntitiesGeneric(drugRepository, entities, Drug.name);

      expect(drugRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
    });

    it('retorna un arreglo vacío cuando no hay entidades (el ciclo do-while igual ejecuta una vez)', async () => {
      drugRepository.save.mockResolvedValue([]);

      const result = await service.saveEntitiesGeneric(drugRepository, [], Drug.name);

      expect(result).toEqual([]);
      expect(drugRepository.save).toHaveBeenCalledTimes(1);
      expect(drugRepository.save).toHaveBeenCalledWith([]);
    });
  });

  // ─── disableEntities ─────────────────────────────────────────────────────

  describe('disableEntities', () => {
    it('actualiza el estado de todas las entidades del esquema WHO_DRUG', async () => {
      await service.disableEntities();

      expect(drugSyncRepository.createQueryBuilder).toHaveBeenCalled();
      expect(drugRepository.createQueryBuilder).toHaveBeenCalled();
      expect(activeIngredientsRepository.createQueryBuilder).toHaveBeenCalled();
      expect(ingredientTranslationRepository.createQueryBuilder).toHaveBeenCalled();
      expect(countrySaleRepository.createQueryBuilder).toHaveBeenCalled();
      expect(maholderRepository.createQueryBuilder).toHaveBeenCalled();
      expect(anatomicalTherapeuticChemicalRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  // ─── truncate ────────────────────────────────────────────────────────────

  describe('truncate', () => {
    it('trunca todas las tablas del esquema WHO_DRUG en cascada', async () => {
      const queryRunner = { query: jest.fn().mockResolvedValue(undefined), release: jest.fn() };
      const connection = {
        getMetadata: jest.fn().mockReturnValue({ schema: 'WHO_DRUG', tableName: 'DRUG' }),
        createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      };
      drugRepository.manager = { connection };

      await service.truncate();

      expect(queryRunner.query).toHaveBeenCalledWith('SET session_replication_role = replica;');
      expect(queryRunner.query).toHaveBeenCalledWith(expect.stringContaining('TRUNCATE TABLE'));
      expect(queryRunner.query).toHaveBeenCalledWith('SET session_replication_role = DEFAULT;');
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('libera el queryRunner y propaga el error si el truncado falla', async () => {
      const queryRunner = {
        query: jest.fn().mockRejectedValue(new Error('lock timeout')),
        release: jest.fn(),
      };
      const connection = {
        getMetadata: jest.fn().mockReturnValue({ schema: 'WHO_DRUG', tableName: 'DRUG' }),
        createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      };
      drugRepository.manager = { connection };

      await expect(service.truncate()).rejects.toThrow('lock timeout');
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
