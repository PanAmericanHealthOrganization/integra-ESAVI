import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SyncService } from 'src/integrator/service/sync.service';
import { ActiveIngredient } from 'src/whodrugs/models/activeIngredient.entity';
import { AnatomicalTherapeuticChemical } from 'src/whodrugs/models/atomicTerapeutalChemical.entity';
import { CountryOfSale } from 'src/whodrugs/models/countryOfSale.entity';
import { Drug } from 'src/whodrugs/models/drug.entity';
import { IDrugResponse } from 'src/whodrugs/models/dtos';
import { IngredientTranslation } from 'src/whodrugs/models/ingredientTranslation.entity';
import { Maholder } from 'src/whodrugs/models/maholder.entity';
import { WhoDrugsClientService } from 'src/whodrugs/services/whodrugs-client.service';
import { WhoDrugsSyncService } from 'src/whodrugs/services/whodrugs-sync.service';

/** Id de la corrida en TR_SYNC_PROCESS que el helper entrega al proceso. */
const SYNC_ID = 'a3f1c2d4-0000-4000-8000-000000000001';
/** El SHA-256 lo calcula ahora el cliente sobre el cuerpo crudo y lo entrega con la descarga. */
const SHA_DESCARGA = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('WhoDrugsSyncService', () => {
  let service: WhoDrugsSyncService;
  let whoDrugsClientService: any;
  let drugRepository: any;
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
    drugRepository = {
      save: jest.fn(), insert: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn(),
      manager: { connection: {} },
    };
    activeIngredientsRepository = { save: jest.fn(), insert: jest.fn(), createQueryBuilder: jest.fn() };
    ingredientTranslationRepository = { save: jest.fn(), insert: jest.fn(), createQueryBuilder: jest.fn() };
    countrySaleRepository = { save: jest.fn(), insert: jest.fn(), createQueryBuilder: jest.fn() };
    anatomicalTherapeuticChemicalRepository = { save: jest.fn(), insert: jest.fn(), createQueryBuilder: jest.fn() };
    maholderRepository = { save: jest.fn(), insert: jest.fn(), createQueryBuilder: jest.fn() };
    // Ejecuta el proceso directamente y propaga el resultado (equivalente a SyncService real),
    // pasándole el id de la corrida como hace el helper real.
    syncService = {
      ejecutarConRegistro: jest.fn(
        async (_source: string, _name: string, proceso: (syncId: string) => Promise<any>) =>
          (await proceso(SYNC_ID))?.resultado,
      ),
      buscarPorMetadatos: jest.fn().mockResolvedValue(null),
    };

    // Todas las llamadas a createQueryBuilder() usadas en disableEntities/updateEntitiesStates
    const chainable: any = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 3 }),
    };
    [
      drugRepository,
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
    it('no procesa nada si el SHA-256 ya está sincronizado y el diccionario tiene datos', async () => {
      whoDrugsClientService.getDrugs.mockResolvedValue({ drugs: [makeDrugResponse()], sha256: SHA_DESCARGA });
      syncService.buscarPorMetadatos.mockResolvedValue({ id: 'CORRIDA-PREVIA' });
      drugRepository.count.mockResolvedValue(5000);

      await service.sync();

      expect(drugRepository.insert).not.toHaveBeenCalled();
    });

    it('vuelve a sincronizar si el SHA-256 coincide pero el diccionario quedó vacío tras un truncate', async () => {
      // El log de sincronizaciones vive en otro esquema y sobrevive al TRUNCATE de
      // WHO_DRUG: sin la comprobación de filas, la base se quedaría vacía para siempre.
      whoDrugsClientService.getDrugs.mockResolvedValue({ drugs: [makeDrugResponse()], sha256: SHA_DESCARGA });
      syncService.buscarPorMetadatos.mockResolvedValue({ id: 'CORRIDA-PREVIA' });
      drugRepository.count.mockResolvedValue(0);
      [
        drugRepository,
        activeIngredientsRepository,
        ingredientTranslationRepository,
        countrySaleRepository,
        maholderRepository,
        anatomicalTherapeuticChemicalRepository,
      ].forEach((repo) => repo.insert.mockResolvedValue(undefined));

      await service.sync();

      expect(drugRepository.insert).toHaveBeenCalled();
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
      whoDrugsClientService.getDrugs.mockResolvedValue({ drugs: [drugResponse], sha256: SHA_DESCARGA });
      syncService.buscarPorMetadatos.mockResolvedValue(null);
      drugRepository.insert.mockResolvedValue(undefined);
      activeIngredientsRepository.insert.mockResolvedValue(undefined);
      ingredientTranslationRepository.insert.mockResolvedValue(undefined);
      countrySaleRepository.insert.mockResolvedValue(undefined);
      maholderRepository.insert.mockResolvedValue(undefined);
      anatomicalTherapeuticChemicalRepository.insert.mockResolvedValue(undefined);

      await service.sync();

      expect(drugRepository.insert).toHaveBeenCalled();
      expect(activeIngredientsRepository.insert).toHaveBeenCalled();
      expect(ingredientTranslationRepository.insert).toHaveBeenCalled();
      expect(countrySaleRepository.insert).toHaveBeenCalled();
      expect(maholderRepository.insert).toHaveBeenCalled();
      expect(anatomicalTherapeuticChemicalRepository.insert).toHaveBeenCalled();
      // Cada fila del diccionario queda estampada con el id de la corrida, que es
      // lo que antes hacía la FK a DRUG_SYNC.
      const drugsGuardados = drugRepository.insert.mock.calls[0][0];
      expect(drugsGuardados[0].syncId).toBe(SYNC_ID);
    });

    it('propaga el error si falla la descarga de WHODrug', async () => {
      whoDrugsClientService.getDrugs.mockRejectedValue(new Error('conexión rechazada'));

      await expect(service.sync()).rejects.toThrow('conexión rechazada');
    });
  });

  // ─── existNewVersion ─────────────────────────────────────────────────────

  describe('existNewVersion', () => {
    it('retorna true si hay una nueva versión disponible', async () => {
      whoDrugsClientService.getDrugs.mockResolvedValue({ drugs: [makeDrugResponse()], sha256: SHA_DESCARGA });
      syncService.buscarPorMetadatos.mockResolvedValue(null);

      expect(await service.existNewVersion()).toBe(true);
    });

    it('retorna false si no hay cambios', async () => {
      whoDrugsClientService.getDrugs.mockResolvedValue({ drugs: [makeDrugResponse()], sha256: SHA_DESCARGA });
      syncService.buscarPorMetadatos.mockResolvedValue({ id: 'CORRIDA-PREVIA' });
      drugRepository.count.mockResolvedValue(5000);

      expect(await service.existNewVersion()).toBe(false);
    });

    it('retorna false (sin lanzar) si ocurre un error consultando la nueva versión', async () => {
      whoDrugsClientService.getDrugs.mockRejectedValue(new Error('parámetro no configurado'));

      expect(await service.existNewVersion()).toBe(false);
    });
  });

  // ─── saveEntitiesGeneric ─────────────────────────────────────────────────

  describe('saveEntitiesGeneric', () => {
    it('inserta las entidades en un solo lote cuando no superan el tamaño de página', async () => {
      const entities = [{ id: '1' }, { id: '2' }] as any[];

      await service.saveEntitiesGeneric(drugRepository, entities, Drug.name);

      expect(drugRepository.insert).toHaveBeenCalledTimes(1);
      expect(drugRepository.insert.mock.calls[0][0]).toHaveLength(2);
    });

    it('trocea en lotes de 5000 cuando hay más entidades', async () => {
      const entities = Array.from({ length: 12000 }, (_, i) => ({ id: String(i) })) as any[];

      await service.saveEntitiesGeneric(drugRepository, entities, Drug.name);

      expect(drugRepository.insert).toHaveBeenCalledTimes(3);
      expect(drugRepository.insert.mock.calls[2][0]).toHaveLength(2000);
    });

    it('no toca la base cuando no hay entidades', async () => {
      // Antes el ciclo era un do-while y ejecutaba una vuelta igualmente, lanzando un
      // guardado con el arreglo vacío.
      await service.saveEntitiesGeneric(drugRepository, [], Drug.name);

      expect(drugRepository.insert).not.toHaveBeenCalled();
    });

    it('usa insert y no save: el id lo asigna el adaptador y la consulta previa sobra', async () => {
      await service.saveEntitiesGeneric(drugRepository, [{ id: '1' }] as any[], Drug.name);

      expect(drugRepository.save).not.toHaveBeenCalled();
    });
  });

  // ─── disableEntities ─────────────────────────────────────────────────────

  describe('disableEntities', () => {
    it('deshabilita todas las entidades del diccionario WHO_DRUG', async () => {
      await service.disableEntities();

      expect(drugRepository.createQueryBuilder).toHaveBeenCalled();
      expect(activeIngredientsRepository.createQueryBuilder).toHaveBeenCalled();
      expect(ingredientTranslationRepository.createQueryBuilder).toHaveBeenCalled();
      expect(countrySaleRepository.createQueryBuilder).toHaveBeenCalled();
      expect(maholderRepository.createQueryBuilder).toHaveBeenCalled();
      expect(anatomicalTherapeuticChemicalRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('ejecuta el update apagando isEnabled/isActive, no las propiedades inexistentes', async () => {
      await service.disableEntities();

      const builder = drugRepository.createQueryBuilder.mock.results[0].value;
      expect(builder.set).toHaveBeenCalledWith({ isEnabled: false, isActive: false });
      // El bug original construía el query pero nunca lo ejecutaba.
      expect(builder.execute).toHaveBeenCalled();
    });

    it('espera a que terminen los updates antes de resolver (antes no se hacía await)', async () => {
      let terminados = 0;
      drugRepository.createQueryBuilder.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          terminados++;
          return { affected: 1 };
        }),
      });

      await service.disableEntities();

      expect(terminados).toBe(1);
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
