import {Injectable,Logger} from '@nestjs/common';
import {Cron,CronExpression} from '@nestjs/schedule';
import {InjectRepository} from '@nestjs/typeorm';
import {formatDate} from 'date-fns';
import {createHash} from 'node:crypto';
import {withAuditOnCreate,withAuditOnUpdate} from 'src/common/utils/audit.util';
import {Auditoria} from 'src/integrator/entity';
import {SyncService} from 'src/integrator/service/sync.service';
import {Repository} from 'typeorm';
import {ActiveIngredient} from '../models/activeIngredient.entity';
import {AnatomicalTherapeuticChemical} from '../models/atomicTerapeutalChemical.entity';
import {DrugSchemaAdapter} from '../models/builders/drug.build';
import {CountryOfSale} from '../models/countryOfSale.entity';
import {Drug} from '../models/drug.entity';
import {DrugSync,DrugSyncBuilder} from '../models/drugSync.entity';
import {IDrugResponse} from '../models/dtos';
import {IngredientTranslation} from '../models/ingredientTranslation.entity';
import {Maholder} from '../models/maholder.entity';
import {SyncStateEnum} from '../utils/sycnstate.enum';
import {uuidGenerator} from '../utils/utils';
import {WhoDrugsClientService} from './whodrugs-client.service';

const cliProgress = require('cli-progress');

/**
 * Esta clase se encargará de la sincronización del json proporcionado por whodrug en la base de datos postgres
 */
@Injectable()
export class WhoDrugsSyncService {
  constructor(
    private readonly whoDrugsClientService: WhoDrugsClientService,

    @InjectRepository(Drug, 'WHO_DRUG')
    private readonly drugRepository: Repository<Drug>,

    @InjectRepository(DrugSync, 'WHO_DRUG')
    private readonly drugSyncRepository: Repository<DrugSync>,

    @InjectRepository(ActiveIngredient, 'WHO_DRUG')
    private readonly activeIngredientsRepository: Repository<ActiveIngredient>,

    @InjectRepository(IngredientTranslation, 'WHO_DRUG')
    private readonly ingredientTranslationRepository: Repository<IngredientTranslation>,

    @InjectRepository(CountryOfSale, 'WHO_DRUG')
    private readonly countrySaleRepository: Repository<CountryOfSale>,

    @InjectRepository(AnatomicalTherapeuticChemical, 'WHO_DRUG')
    private readonly anatomicalTherapeuticChemicalRepository: Repository<AnatomicalTherapeuticChemical>,

    @InjectRepository(Maholder, 'WHO_DRUG')
    private readonly maholderRepository: Repository<Maholder>,

    private readonly syncService: SyncService,
  ) {}

  private readonly logger = new Logger(WhoDrugsSyncService.name);

  async listSyncs(page: number, size: number): Promise<{ data: DrugSync[]; total: number }> {
    const [data, total] = await this.drugSyncRepository.findAndCount({
      order: { startSyncDate: 'DESC' },
      skip: page * size,
      take: size,
    });
    return { data, total };
  }

  /**
   * Este método se encarga de sincronizar el json proporcionado por whodrug en la base de datos postgres
   * @returns
   */
  public async sync(): Promise<void> {
    await this.syncService.ejecutarConRegistro('Sincronización WHODrug', async () => {
      try {
        // Obtener la sincronización
        this.logger.log('Iniciando sincronización, descargando archivo de whodrugs');
        //
        const drugsResponse = await this.whoDrugsClientService.getDrugs(3, 'es-ES', true);
        const sha256 = createHash('sha256').update(JSON.stringify(drugsResponse)).digest('hex');

        // Verificar si hay actualizaciones
        const existe = await this.getDrugSyncBySHA(sha256);
        if (existe) {
          return { mensaje: 'Sin cambios: la versión de WHODrug ya se encontraba sincronizada' };
        }

        // Procesar la sincronización
        const drugSync = await this.createDrugSync(sha256);
        this.logger.log(`Syncronización iniciada ${drugSync.id} a las ${drugSync.startSyncDate}`);
        await this.saveDrugs(drugsResponse, drugSync);
        this.logger.log(`Syncronización finalizada ${drugSync.id} a las ${drugSync.endSyncDate}`);
        return { mensaje: `Sincronización WHODrug completada (drug sync ${drugSync.id})` };
      } catch (e) {
        this.logger.error(`Error al procesar la sincronización ${e.message}`);
        throw e;
      } finally {
        this.logger.log('Proceso Finalizado');
      }
    });
  }

  /**
   *
   * Task to run every 10 minutes, to check if exist a new version of whodrugs
   * @returns
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM, { name: 'askExistNewVersion' })
  async existNewVersion(): Promise<boolean> {
    this.logger.log(
      `Consultando si existe una nueva versión de whodrugs ${formatDate(
        new Date(),
        'yyyy-MM-dd HH:mm:ss',
      )}`,
    );
    const drugsResponse = await this.whoDrugsClientService.getDrugs(3, 'es-ES', true);
    const sha256 = createHash('sha256').update(JSON.stringify(drugsResponse)).digest('hex');

    if (await this.getDrugSyncBySHA(sha256)) {
      // TODO: IMPLEMENTAR UN ENVIADOR DE MAIL.
      this.logger.log('Existe una nueva versión de whodrugs ${}');
      return true;
    }
    this.logger.log('No hay nuevas actualizaciones');
    return false;
  }

  /**
   *
   * @param drugs
   * @param drugSync
   */
  private async saveDrugs(drugs: IDrugResponse[], drugSync: DrugSync): Promise<void> {
    await this.disableEntities();

    const drugsEntities = [];
    //1
    let activeIngredientsEntities = [];
    let ingredientTranslationsEntities = [];
    //2
    let countryOfSalesEntities = [];
    let maholdersEntities = [];
    //3
    let atcsEntities = [];
    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    bar1.start(drugs.length, 1);
    (drugs || []).forEach((drugR, index) => {
      bar1.update(index);
      const drugAdapter = new DrugSchemaAdapter(drugR, drugSync);
      const { drug, activeIngredients, ingredientTranslations, countryOfSales, maholders, atcs } =
        drugAdapter.getEntities();
      drugsEntities.push(drug);
      //1
      activeIngredientsEntities = activeIngredientsEntities.concat(activeIngredients);

      ingredientTranslationsEntities =
        ingredientTranslationsEntities.concat(ingredientTranslations);
      //2
      countryOfSalesEntities = countryOfSalesEntities.concat(countryOfSales);
      maholdersEntities = maholdersEntities.concat(maholders);
      //3
      atcsEntities = atcsEntities.concat(atcs);
    });
    bar1.stop();
    await this.saveEntitiesGeneric<Drug>(this.drugRepository, drugsEntities, Drug.name);
    await this.saveEntitiesGeneric<ActiveIngredient>(
      this.activeIngredientsRepository,
      activeIngredientsEntities,
      ActiveIngredient.name,
    );
    await this.saveEntitiesGeneric<IngredientTranslation>(
      this.ingredientTranslationRepository,
      ingredientTranslationsEntities,
      IngredientTranslation.name,
    );
    await this.saveEntitiesGeneric<CountryOfSale>(
      this.countrySaleRepository,
      countryOfSalesEntities,
      CountryOfSale.name,
    );
    await this.saveEntitiesGeneric<Maholder>(
      this.maholderRepository,
      maholdersEntities,
      Maholder.name,
    );
    await this.saveEntitiesGeneric<AnatomicalTherapeuticChemical>(
      this.anatomicalTherapeuticChemicalRepository,
      atcsEntities,
      AnatomicalTherapeuticChemical.name,
    );
    //
    await this.updateDrugSync(drugSync);
  }
  /*
   *
   */
  private async createDrugSync(sha256: string): Promise<DrugSync> {
    try {
      const drugSync = new DrugSyncBuilder()
        .setEnabled(true)
        .setState(true)
        .setStartSyncDate(new Date())
        .setId(uuidGenerator(11))
        .setProccesId(uuidGenerator(11))
        .setEndSyncDate(null)
        .setSha256(sha256)
        .setSyncStatus(SyncStateEnum.STARTED)
        .build();
      return await this.drugSyncRepository.save(withAuditOnCreate(drugSync));
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  /**
   *
   * @param drugSync
   * @returns
   */
  private async updateDrugSync(drugSync: DrugSync) {
    try {
      drugSync.endSyncDate = new Date();
      drugSync.syncStatus = SyncStateEnum.FINISHED;
      withAuditOnUpdate(drugSync);
      return await this.drugSyncRepository.save(drugSync);
    } catch (e) {
      this.logger.error(e);
      throw e;
    } finally {
      this.logger.log('Sincronización Finalizada');
    }
  }

  /**
   *
   * @param sha256
   * @returns
   */
  // private async getDrugSyncBySHA(sha256: string): Promise<boolean> {
  //   return await this.drugSyncRepository.exists({
  //     where: { sha256: sha256 },
  //   });
  // }
  private async getDrugSyncBySHA(sha256: string): Promise<boolean> {
    const count = await this.drugSyncRepository.count({
      where: { sha256: sha256 },
    });
    return count > 0; // Devuelve true si hay al menos un registro
  }

  /**
   *
   * @param entities
   * @returns
   */
  public async saveEntitiesGeneric<T extends Auditoria>(
    repositorySaver: Repository<T>,
    entities: T[],
    entityName: string,
  ): Promise<T[]> {
    let page = 0;
    const size = 5000;
    const fullEntitiesSaved: T[] = [];
    this.logger.log(`Total: ${entities.length} entidades de ${entityName}`);
    do {
      const entitiesToSave = entities
        .slice(page * size, (page + 1) * size)
        .map((entity) => withAuditOnCreate(entity));
      this.logger.log(`|---- Guardado  de ${page * size} a ${(page + 1) * size}`);
      let entitiesSaved = [];
      entitiesSaved = await repositorySaver.save(entitiesToSave);
      fullEntitiesSaved.push(...entitiesSaved);
      page++;
    } while (entities.length > page * size);
    //
    return fullEntitiesSaved;
  }
  /**
   *
   */
  public async disableEntities() {
    this.logger.log('Actualizando estados');
    this.updateEntitiesStates<DrugSync>(this.drugSyncRepository, DrugSync.name);
    this.updateEntitiesStates<Drug>(this.drugRepository, Drug.name);
    this.updateEntitiesStates<ActiveIngredient>(
      this.activeIngredientsRepository,
      ActiveIngredient.name,
    );
    this.updateEntitiesStates<IngredientTranslation>(
      this.ingredientTranslationRepository,
      IngredientTranslation.name,
    );
    this.updateEntitiesStates<CountryOfSale>(this.countrySaleRepository, CountryOfSale.name);
    this.updateEntitiesStates<Maholder>(this.maholderRepository, Maholder.name);

    this.updateEntitiesStates<AnatomicalTherapeuticChemical>(
      this.anatomicalTherapeuticChemicalRepository,
      AnatomicalTherapeuticChemical.name,
    );
  }

  /**
   * Trunca todas las tablas del esquema WHO_DRUG en cascada,
   * incluyendo DRUG_SYNC para que una nueva sincronización no se omita por SHA repetido.
   */
  public async truncate(): Promise<void> {
    this.logger.log('Truncando tablas del esquema WHO_DRUG...');
    const connection = this.drugRepository.manager.connection;

    const listaTablas = [
      Drug,
      ActiveIngredient,
      IngredientTranslation,
      CountryOfSale,
      Maholder,
      AnatomicalTherapeuticChemical,
      DrugSync,
    ]
      .map((entity) => {
        const metadata = connection.getMetadata(entity);
        return `"${metadata.schema}"."${metadata.tableName}"`;
      })
      .join(', ');

    const queryRunner = connection.createQueryRunner();
    try {
      await queryRunner.query('SET session_replication_role = replica;');
      await queryRunner.query(`TRUNCATE TABLE ${listaTablas} CASCADE;`);
      await queryRunner.query('SET session_replication_role = DEFAULT;');
      this.logger.log('Tablas del esquema WHO_DRUG truncadas exitosamente');
    } catch (error) {
      this.logger.error(`Error al truncar las tablas de WHO_DRUG: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   *
   * @param repositoryUpdater
   * @param entityName
   */
  public async updateEntitiesStates<T>(repositoryUpdater: Repository<T>, entityName: string) {
    this.logger.log('Actualizando estados de ' + entityName);
    repositoryUpdater
      .createQueryBuilder()
      .update(entityName)
      .set({ enabled: true, state: true })
      .where('enabled = :enabled', { enabled: false })
      .orWhere('state =:state', { state: false });
  }
}
