import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { MeddraSync } from '../models/standar/meddraSync.entity';
import { MeddraSyncService } from '../services/meddra-sync.service';

@ApiTags('MedDra Versionamiento')
@Controller({ path: 'meddra/sync', version: '1' })
export class MeddraSyncController {
  constructor(private readonly meddraSyncService: MeddraSyncService) {}

  @Get('list')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'size', required: false })
  async listSyncs(
    @Query('page') page = 0,
    @Query('size') size = 10,
  ): Promise<{ data: MeddraSync[]; total: number }> {
    return this.meddraSyncService.listSyncs(+page, +size);
  }
}
