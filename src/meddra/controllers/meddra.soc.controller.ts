import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SOC } from '../models/standar/soc.entity';
import { MeddraSocService } from '../services/meddra-soc.service';

/**
 *
 */
@ApiTags('soc', 'Meddra Standar')
@Controller({ path: 'meddra/soc', version: '1' })
export class MeddraSocController {
  constructor(private readonly meddraSocService: MeddraSocService) {}

  /**
   *
   * @param term
   * @returns
   */
  @Get('search')
  async searchSOC(@Query('term') term: string): Promise<SOC[]> {
    return this.meddraSocService.searchSOC(term);
  }
}
