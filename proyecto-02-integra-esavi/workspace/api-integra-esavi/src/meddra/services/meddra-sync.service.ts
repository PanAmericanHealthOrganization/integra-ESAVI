import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeddraSync } from '../models/standar/meddraSync.entity';

@Injectable()
export class MeddraSyncService {
  constructor(
    @InjectRepository(MeddraSync, 'meddra')
    private readonly meddraSyncRepository: Repository<MeddraSync>,
  ) {}

  async listSyncs(page: number, size: number): Promise<{ data: MeddraSync[]; total: number }> {
    const [data, total] = await this.meddraSyncRepository.findAndCount({
      order: { startSyncDate: 'DESC' },
      skip: page * size,
      take: size,
    });
    return { data, total };
  }
}
