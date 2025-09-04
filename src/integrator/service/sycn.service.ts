import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncProcess } from '../entity';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { ISync } from '../dto/sync.dto';

@Injectable()
export class SyncService extends TypeOrmCrudService<SyncProcess> {
  constructor(
    @InjectRepository(SyncProcess, 'POSTGRES_INTEGRATOR_DS')
    private syncProcessRepository: Repository<SyncProcess>,
  ) {
    super(syncProcessRepository);
  }

  async createSyncProcess(syncProcess: ISync): Promise<SyncProcess> {
    return this.syncProcessRepository.save(syncProcess);
  }
}
