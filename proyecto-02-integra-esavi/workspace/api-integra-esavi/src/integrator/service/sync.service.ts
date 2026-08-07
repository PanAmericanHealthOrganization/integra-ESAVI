import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { withAuditOnCreate } from 'src/common/utils/audit.util';
import { Identificator, IGetManyParams, IService } from 'src/utils/IController';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { Repository } from 'typeorm';
import { CreateSyncDto, ISync, SyncDto, UpdateSyncDto } from '../dto/sync.dto';
import { SyncProcess, SyncSource, SyncStatus } from '../entity';
/**
 *
 */
@Injectable()
export class SyncService implements IService<CreateSyncDto, SyncDto, UpdateSyncDto> {
  /**
   *
   * @param syncProcessRepository
   */
  constructor(
    @InjectRepository(SyncProcess, 'POSTGRES_INTEGRATOR_DS')
    private syncProcessRepository: Repository<SyncProcess>,
  ) {}

  /**
   *
   * @param id
   * @returns
   */
  public async exist(id: number | string): Promise<boolean> {
    const t = this.syncProcessRepository.findOne({
      select: { id: true },
      where: { id: id as string },
    });
    return t ? true : false;
  }

  /**
   *
   * @param id
   * @returns
   */
  public async getPaginated(paginated: GetListParams): Promise<{ data: SyncDto[]; total: number }> {
    const { pagination, sort, filter } = paginated;
    const { page, perPage } = pagination;
    const sortOrder = sort.order === 'ASC' ? 'ASC' : 'DESC';
    const sortField = sort.field || 'startTime';
    const csort = {};
    csort[sortField] = sortOrder;
    // Cada pantalla (MedDRA, WHODrug, datamart) pide sólo su propia fuente sobre
    // esta misma tabla; sin filtro se devuelve el log completo.
    const where = filter?.source ? { source: filter.source } : {};
    const [data, total] = await this.syncProcessRepository.findAndCount({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      order: { ...csort },
    });
    return { data, total };
  }

  /**
   *
   * @param id
   * @returns
   */
  public async create(data: CreateSyncDto): Promise<SyncDto> {
    const entity = this.syncProcessRepository.create(data);
    return await this.syncProcessRepository.save(entity);
  }

  /**
   *
   * @param id
   * @returns
   */
  public async update(id: Identificator, data: UpdateSyncDto): Promise<SyncDto> {
    await this.syncProcessRepository.update(id, { ...data, id: id as string });
    return this.syncProcessRepository.findOneBy({ id: id as string });
  }

  /**
   *
   * @param id
   * @returns
   */
  public async delete(id: Identificator, auditData: any): Promise<SyncDto> {
    await this.syncProcessRepository.update(id, { state: false, enabled: false, ...auditData });
    return this.syncProcessRepository.findOneBy({ id: id as string });
  }

  /**
   *
   * @param id
   * @returns
   */
  public async createSyncProcess(syncProcess: ISync): Promise<SyncProcess> {
    const t = this.syncProcessRepository.create(syncProcess);
    return this.syncProcessRepository.save(t);
  }

  /**
   * Único camino para registrar una sincronización.
   *
   * Abre la corrida en TR_SYNC_PROCESS con estado RUNNING, ejecuta el proceso y
   * la cierra en COMPLETED o FAILED. El proceso recibe el id de su propia
   * corrida —MedDRA y WHODrug lo estampan en las filas que insertan, ahora que
   * no tienen tabla de sincronización propia— y devuelve el mensaje a registrar,
   * el resultado a propagar y los metadatos a fusionar (sha256, versión, etc.).
   *
   * Cualquier excepción se registra y se vuelve a lanzar: quien llama decide si
   * la propaga o la absorbe.
   */
  public async ejecutarConRegistro<T>(
    source: SyncSource,
    syncName: string,
    proceso: (syncId: string) => Promise<{ resultado?: T; mensaje: string; metadata?: Record<string, any> }>,
    opciones: {
      dataStartDate?: Date | null;
      dataEndDate?: Date | null;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<T> {
    const syncRecord = await this.createSyncProcess(
      withAuditOnCreate({
        source,
        name: syncName,
        status: SyncStatus.RUNNING,
        startTime: new Date(),
        endTime: null,
        dataStartDate: opciones.dataStartDate ?? null,
        dataEndDate: opciones.dataEndDate ?? null,
        metadata: opciones.metadata ?? null,
        message: null,
        errorMessage: null,
        errorStack: null,
      }) as ISync,
    );

    try {
      const { resultado, mensaje, metadata } = await proceso(syncRecord.id);
      await this.update(syncRecord.id, {
        status: SyncStatus.COMPLETED,
        endTime: new Date(),
        message: mensaje,
        // Los metadatos que sólo se conocen al terminar (conteos, sha256) se
        // fusionan con los que se pasaron al abrir la corrida.
        metadata: { ...(syncRecord.metadata ?? {}), ...(metadata ?? {}) },
      });
      return resultado;
    } catch (error) {
      await this.update(syncRecord.id, {
        status: SyncStatus.FAILED,
        endTime: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : null,
      });
      throw error;
    }
  }

  /**
   * Busca la última corrida COMPLETED de una fuente cuyos metadatos coincidan
   * con todos los pares indicados. Reemplaza las consultas que MedDRA y WHODrug
   * hacían contra sus tablas propias para detectar "versión ya cargada"
   * (`{version, lang}`) y "sin cambios" (`{sha256}`).
   *
   * Se restringe a COMPLETED a propósito: una carga que falló a medias no debe
   * hacer que la siguiente corrida se dé por hecha y se omita.
   */
  public async buscarPorMetadatos(
    source: SyncSource,
    metadatos: Record<string, string>,
  ): Promise<SyncProcess | null> {
    const qb = this.syncProcessRepository
      .createQueryBuilder('sync')
      .where('sync.source = :source', { source })
      .andWhere('sync.status = :status', { status: SyncStatus.COMPLETED });

    // Las claves son literales del código (no entran por request), pero se
    // parametrizan igual para no concatenar nada en el SQL.
    Object.entries(metadatos).forEach(([clave, valor], i) => {
      qb.andWhere(`sync.metadata ->> :clave${i} = :valor${i}`, {
        [`clave${i}`]: clave,
        [`valor${i}`]: valor,
      });
    });

    return qb.orderBy('sync.startTime', 'DESC').getOne();
  }

  /**
   *
   * @param params
   * @returns
   */

  /**
   *
   * @param id
   * @returns
   */
  public async getMany(params: IGetManyParams): Promise<SyncProcess[]> {
    try {
      console.log('Fetching sync processes with params:', params);
      const [data] = await this.syncProcessRepository.findAndCount({
        where: { isEnabled: true, isActive: true },
        order: { createdAt: 'DESC' },
      });
      return data;
    } catch (error) {
      console.error('Error fetching sync processes:', error);
      throw error;
    }
  }

  /**
   *
   * @param id
   * @returns
   */

  /**
   *
   * @param id
   * @returns
   */
  public async getOne(id: string): Promise<SyncProcess> {
    return this.syncProcessRepository.findOneBy({ id });
  }

  /**
   *
   * @returns
   */

  /**
   *
   * @param id
   * @returns
   */
  public async getList(): Promise<SyncProcess[]> {
    return this.syncProcessRepository.find({
      where: { isEnabled: true, isActive: true },
    });
  }
}
