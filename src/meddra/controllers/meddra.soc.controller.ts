import { Controller, Get, Query } from '@nestjs/common';
import { SOC } from '../models/standar/soc.entity';
import { MeddraSocService } from '../services/meddra-soc.service';

@Controller({ path: 'meddra/soc', version: '1' })
export class MeddraSocController {
  constructor(private readonly meddraSocService: MeddraSocService) {}

  // Endpoint para buscar SOCs
  @Get('search')
  async searchSOC(@Query('term') term: string): Promise<SOC[]> {
    return this.meddraSocService.searchSOC(term);
  }
}
