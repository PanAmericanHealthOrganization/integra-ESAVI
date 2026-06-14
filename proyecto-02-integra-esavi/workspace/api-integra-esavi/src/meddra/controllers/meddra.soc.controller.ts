import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SOC } from '../models/standar/soc.entity';
import { MeddraSocService } from '../services/meddra-soc.service';

@ApiTags('soc', 'Meddra Standar')
@Controller({ path: 'meddra/soc', version: '1' })
export class MeddraSocController {
  constructor(private readonly meddraSocService: MeddraSocService) {}

  @Get('list')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'size', required: false })
  @ApiQuery({ name: 'term', required: false })
  async listSOCs(
    @Query('page') page = 0,
    @Query('size') size = 20,
    @Query('term') term?: string,
  ): Promise<{ data: SOC[]; total: number }> {
    return this.meddraSocService.listSOCs(+page, +size, term);
  }

  @Get('search')
  async searchSOC(@Query('term') term: string): Promise<SOC> {
    return this.meddraSocService.searchSOC(term);
  }
}
