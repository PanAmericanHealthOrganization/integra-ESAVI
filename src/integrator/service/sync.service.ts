import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IPaginationRequest,
  IPaginationResponse,
} from 'src/utils/interfaces/pagination';
import { Repository } from 'typeorm';
import { ISync } from '../dto/sync.dto';
import { SyncProcess } from '../entity';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(SyncProcess, 'POSTGRES_INTEGRATOR_DS')
    private syncProcessRepository: Repository<SyncProcess>,
  ) {}

  async createSyncProcess(syncProcess: ISync): Promise<SyncProcess> {
    const t = this.syncProcessRepository.create(syncProcess);
    return this.syncProcessRepository.save(t);
  }

  /**
   *
   * @param params
   * @returns
   */
  public async getMany(
    params: IPaginationRequest<SyncProcess>,
  ): Promise<IPaginationResponse<SyncProcess[]>> {
    try {
      const { page, size } = params;
      const [data, total] = await this.syncProcessRepository.findAndCount({
        where: { enabled: true, state: true },
        skip: (page - 1) * size,
        take: size || 10,
        order: { createdAt: 'DESC' },
      });
      return { data, total };
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
  public async getOne(id: string): Promise<SyncProcess> {
    return this.syncProcessRepository.findOneBy({ id });
  }

  /**
   *
   * @returns
   */
  public async getList(): Promise<SyncProcess[]> {
    return this.syncProcessRepository.find({
      where: { enabled: true, state: true },
    });
  }
}
