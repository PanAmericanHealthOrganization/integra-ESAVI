import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncProcess } from '../entity';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';

@Injectable()
export class SyncService extends TypeOrmCrudService<SyncProcess> {
  constructor(
    @InjectRepository(SyncProcess)
    private syncProcessRepository: Repository<SyncProcess>,
  ) {
    super(syncProcessRepository);
  }
}
