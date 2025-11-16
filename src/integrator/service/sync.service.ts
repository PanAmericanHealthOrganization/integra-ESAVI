import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Identificator, IGetManyParams, IService } from 'src/utils/IController';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { Repository } from 'typeorm';
import { CreateSyncDto, ISync, SyncDto, UpdateSyncDto } from '../dto/sync.dto';
import { SyncProcess } from '../entity';
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
    const { pagination, sort } = paginated;
    const { page, perPage } = pagination;
    const sortOrder = sort.order === 'ASC' ? 'ASC' : 'DESC';
    const sortField = sort.field || 'createdAt';
    const csort = {};
    csort[sortField] = sortOrder;
    const [data, total] = await this.syncProcessRepository.findAndCount({
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
