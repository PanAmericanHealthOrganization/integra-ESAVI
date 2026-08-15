import {Injectable,Logger} from '@nestjs/common';
import {Cron,CronExpression} from '@nestjs/schedule';
import {InjectRepository} from '@nestjs/typeorm';
import {formatDate} from 'date-fns';
import {withAuditOnCreate} from 'src/common/utils/audit.util';
import {Auditoria,SyncSource} from 'src/integrator/entity';
import {SyncService} from 'src/integrator/service/sync.service';
import {DestinatarioNotificacion} from 'src/mensajes/models/notificacion.interface';
import {Repository} from 'typeorm';
import {QueryDeepPartialEntity} from 'typeorm/query-builder/QueryPartialEntity';
import {ActiveIngredient} from '../models/activeIngredient.entity';
import {AnatomicalTherapeuticChemical} from '../models/atomicTerapeutalChemical.entity';
import {DrugSchemaAdapter} from '../models/builders/drug.build';
import {CountryOfSale} from '../models/countryOfSale.entity';
import {Drug} from '../models/drug.entity';
import {IDrugResponse} from '../models/dtos';
import {IngredientTranslation} from '../models/ingredientTranslation.entity';
import {Maholder} from '../models/maholder.entity';
import {WhoDrugsClientService} from './whodrugs-client.service';

/**
 * Esta clase se encargará de la sincronización del json proporcionado por whodrug en la base de datos postgres
 */
@Injectable()
export class WhoDrugsSyncService {
  /** Cada cuántos medicamentos se devuelve el turno al event loop mientras se construyen entidades. */
  private static readonly MEDICAMENTOS_POR_PAUSA = 2000;

  /**
   * Tope de argumentos por `push(...)`. El spread los pasa como argumentos de la llamada y
   * un array grande desborda la pila; por eso se agrega en tramos en vez de `push(...todo)`.
   */
  private static readonly MAX_ARGUMENTOS_PUSH = 10000;

  constructor(
    private readonly whoDrugsClientService: WhoDrugsClientService,

    @InjectRepository(Drug, 'WHO_DRUG')
    private readonly drugRepository: Repository<Drug>,

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

  /**
   * Este método se encarga de sincronizar el json proporcionado por whodrug en la base de datos postgres
   * @returns
   */
  public async sync(usuario?: DestinatarioNotificacion | null): Promise<void> {
    await this.syncService.ejecutarConRegistro(
      SyncSource.WHODRUG,
      'Sincronización WHODrug',
      async (syncId) => {
        try {
          // Obtener la sincronización
          this.logger.log('Iniciando sincronización, descargando archivo de whodrugs');
          // El SHA-256 lo calcula el cliente sobre el cuerpo tal como llegó, mientras lo
          // recibe; aquí ya no se vuelve a serializar el diccionario para obtenerlo.
          const { drugs: drugsResponse, sha256 } = await this.whoDrugsClientService.getDrugs(
            3,
            'es-ES',
            true,
          );

          // Verificar si hay actualizaciones. Va antes de construir una sola entidad: si la
          // versión ya está cargada, la corrida termina sin tocar la base ni la memoria.
          const existe = await this.existeSincronizacionConSHA(sha256);
          if (existe) {
            return {
              mensaje: 'Sin cambios: la versión de WHODrug ya se encontraba sincronizada',
              metadata: { sha256, sinCambios: true },
            };
          }

          // Procesar la sincronización. El id de la corrida queda estampado en
          // cada fila del diccionario (Drug.syncId), que es lo que antes hacía
          // la FK a DRUG_SYNC.
          this.logger.log(`Sincronización ${syncId} iniciada`);
          await this.saveDrugs(drugsResponse, syncId);
          this.logger.log(`Sincronización ${syncId} finalizada`);
          return {
            mensaje: `Sincronización WHODrug completada (${drugsResponse?.length ?? 0} medicamentos)`,
            metadata: { sha256, drugs: drugsResponse?.length ?? 0 },
          };
        } catch (e) {
          this.logger.error(`Error al procesar la sincronización ${e.message}`);
          throw e;
        } finally {
          this.logger.log('Proceso Finalizado');
        }
      },
      { usuario },
    );
  }

  /**
   *
   * Task to run every 10 minutes, to check if exist a new version of whodrugs
   * @returns
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM, { name: 'askExistNewVersion' })
  async existNewVersion(): Promise<boolean> {
    try {
      this.logger.log(
        `Consultando si existe una nueva versión de whodrugs ${formatDate(
          new Date(),
          'yyyy-MM-dd HH:mm:ss',
        )}`,
      );
      const { sha256 } = await this.whoDrugsClientService.getDrugs(3, 'es-ES', true);

      if (await this.existeSincronizacionConSHA(sha256)) {
        this.logger.log('No hay nuevas actualizaciones');
        return false;
      }
      // TODO: IMPLEMENTAR UN ENVIADOR DE MAIL.
      this.logger.log('Existe una nueva versión de whodrugs');
      return true;
    } catch (e) {
      // El cron no debe terminar en una excepción no manejada (p. ej. si el
      // parámetro WHD_UMC_* aún no está registrado en TC_PARAMETRO).
      this.logger.error(`Error al consultar nueva versión de whodrugs: ${e.message}`);
      return false;
    }
  }

  /**
   *
   * @param drugs
   * @param drugSync
   */
  private async saveDrugs(drugs: IDrugResponse[], syncId: string): Promise<void> {
    await this.disableEntities();

    const drugsEntities: Drug[] = [];
    //1
    const activeIngredientsEntities: ActiveIngredient[] = [];
    const ingredientTranslationsEntities: IngredientTranslation[] = [];
    //2
    const countryOfSalesEntities: CountryOfSale[] = [];
    const maholdersEntities: Maholder[] = [];
    //3
    const atcsEntities: AnatomicalTherapeuticChemical[] = [];

    const total = drugs?.length ?? 0;
    this.logger.log(`Construyendo entidades de ${total} medicamentos...`);

    for (let index = 0; index < total; index++) {
      const drugAdapter = new DrugSchemaAdapter(drugs[index], syncId);
      const { drug, activeIngredients, ingredientTranslations, countryOfSales, maholders, atcs } =
        drugAdapter.getEntities();
      drugsEntities.push(drug);
      //1
      // `agregar` en vez de `concat`: reasignar el acumulado copiaba en cada vuelta todo lo
      // ya acumulado, con lo que construir el diccionario era cuadrático sobre el total de
      // filas —el grueso del tiempo que la sincronización dejaba la API sin responder—.
      WhoDrugsSyncService.agregar(activeIngredientsEntities, activeIngredients);
      WhoDrugsSyncService.agregar(ingredientTranslationsEntities, ingredientTranslations);
      //2
      WhoDrugsSyncService.agregar(countryOfSalesEntities, countryOfSales);
      WhoDrugsSyncService.agregar(maholdersEntities, maholders);
      //3
      WhoDrugsSyncService.agregar(atcsEntities, atcs);

      // Node es de un solo hilo: sin esta pausa el bucle entero corre sin ceder y ninguna
      // petición HTTP —ni el healthcheck— se atiende hasta que termina.
      if ((index + 1) % WhoDrugsSyncService.MEDICAMENTOS_POR_PAUSA === 0) {
        this.logger.log(`|---- ${index + 1} de ${total} medicamentos procesados`);
        await WhoDrugsSyncService.cederElTurno();
      }
    }

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
  }

  /**
   * ¿Esta descarga ya está sincronizada? El SHA-256 vive ahora como metadato de
   * la corrida en TR_SYNC_PROCESS (antes en DRUG_SYNC.DRS_SHA_256). Sólo cuentan
   * las corridas COMPLETED: si una descarga falló a medias, la siguiente debe
   * volver a intentarla en vez de darla por hecha.
   *
   * Además se exige que el diccionario tenga filas. Antes `truncate()` borraba
   * DRUG_SYNC junto con los datos, y con ello el SHA; ahora el log vive en otro
   * esquema y sobrevive al truncado, así que sin esta comprobación una BD vacía
   * con SHA idéntico se quedaría vacía para siempre.
   */
  private async existeSincronizacionConSHA(sha256: string): Promise<boolean> {
    const corrida = await this.syncService.buscarPorMetadatos(SyncSource.WHODRUG, { sha256 });
    if (!corrida) return false;
    const drogasCargadas = await this.drugRepository.count({ where: { isEnabled: true } });
    return drogasCargadas > 0;
  }

  /** Añade `origen` al final de `destino` sin reasignar el array ni desbordar la pila. */
  private static agregar<T>(destino: T[], origen: T[]): void {
    if (!origen?.length) return;
    for (let i = 0; i < origen.length; i += WhoDrugsSyncService.MAX_ARGUMENTOS_PUSH) {
      destino.push(...origen.slice(i, i + WhoDrugsSyncService.MAX_ARGUMENTOS_PUSH));
    }
  }

  /**
   * Devuelve el turno al event loop.
   *
   * `setImmediate` y no `setTimeout(0)`: se encola tras la fase de I/O, de modo que las
   * peticiones pendientes se atienden antes de reanudar el bucle de construcción.
   */
  private static cederElTurno(): Promise<void> {
    return new Promise((resolve) => setImmediate(resolve));
  }

  /**
   * Inserta las entidades por lotes.
   *
   * `insert` y no `save`: el id de estas entidades lo asigna el adaptador (`uuidGenerator`),
   * así que para `save` son entidades "con id" y consulta la base antes de cada lote para
   * decidir INSERT o UPDATE. Aquí siempre son altas de una versión recién descargada, y esa
   * consulta previa sólo añade trabajo. Tampoco se acumula el resultado: nadie lo usa y con
   * un diccionario completo era otro array gigante retenido en memoria hasta el final.
   */
  public async saveEntitiesGeneric<T extends Auditoria>(
    repositorySaver: Repository<T>,
    entities: T[],
    entityName: string,
  ): Promise<void> {
    const size = 5000;
    this.logger.log(`Total: ${entities.length} entidades de ${entityName}`);
    for (let desde = 0; desde < entities.length; desde += size) {
      const entitiesToSave = entities
        .slice(desde, desde + size)
        .map((entity) => withAuditOnCreate(entity));
      this.logger.log(`|---- Guardado de ${desde} a ${desde + entitiesToSave.length}`);
      await repositorySaver.insert(entitiesToSave as QueryDeepPartialEntity<T>[]);
      await WhoDrugsSyncService.cederElTurno();
    }
  }
  /**
   * Deshabilita TODAS las filas del diccionario antes de guardar la nueva versión.
   *
   * Cada corrida genera identificadores nuevos (`uuidGenerator`), así que `save()` inserta
   * filas en lugar de sobrescribir las anteriores: este barrido es lo único que retira de
   * circulación la versión previa, porque todas las consultas del módulo filtran por
   * `isEnabled`/`isActive`. Las filas que sí vienen en la nueva descarga se guardan a
   * continuación con `withAuditOnCreate`, que las deja habilitadas otra vez.
   */
  public async disableEntities() {
    this.logger.log('Deshabilitando las entidades de la sincronización anterior');
    await Promise.all([
      this.updateEntitiesStates<Drug>(this.drugRepository, Drug.name),
      this.updateEntitiesStates<ActiveIngredient>(this.activeIngredientsRepository, ActiveIngredient.name),
      this.updateEntitiesStates<IngredientTranslation>(
        this.ingredientTranslationRepository,
        IngredientTranslation.name,
      ),
      this.updateEntitiesStates<CountryOfSale>(this.countrySaleRepository, CountryOfSale.name),
      this.updateEntitiesStates<Maholder>(this.maholderRepository, Maholder.name),
      this.updateEntitiesStates<AnatomicalTherapeuticChemical>(
        this.anatomicalTherapeuticChemicalRepository,
        AnatomicalTherapeuticChemical.name,
      ),
    ]);
  }

  /**
   * Trunca todas las tablas del esquema WHO_DRUG en cascada.
   *
   * El log de sincronizaciones no se toca: vive en DHI_ESAVI.TR_SYNC_PROCESS y es
   * histórico. Que la siguiente corrida no se omita por SHA repetido lo garantiza
   * `existeSincronizacionConSHA`, que exige además que el diccionario tenga filas.
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
   * Marca como no habilitadas/no activas todas las filas de la entidad indicada.
   *
   * Antes este método construía el query builder pero nunca lo ejecutaba (faltaba
   * `.execute()`), y además seteaba propiedades inexistentes —`enabled`/`state` en lugar de
   * `isEnabled`/`isActive`, que son las que declara `Auditoria`—, de modo que no tenía ningún
   * efecto: el diccionario acumulaba todas las versiones históricas habilitadas a la vez.
   */
  public async updateEntitiesStates<T extends Auditoria>(
    repositoryUpdater: Repository<T>,
    entityName: string,
  ): Promise<void> {
    const resultado = await repositoryUpdater
      .createQueryBuilder()
      .update()
      // El doble cast es necesario porque T es genérico: TypeScript no puede probar que un
      // parcial de Auditoria encaje en QueryDeepPartialEntity<T> sin conocer T.
      .set({ isEnabled: false, isActive: false } as unknown as QueryDeepPartialEntity<T>)
      // Criterio explícito: TypeORM rechaza un UPDATE sin WHERE para evitar barridos accidentales.
      .where('1 = 1')
      .execute();

    this.logger.log(`|---- ${resultado?.affected ?? 0} filas de ${entityName} deshabilitadas`);
  }
}
