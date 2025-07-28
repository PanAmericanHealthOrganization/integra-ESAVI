import { Controller, Get, Query } from '@nestjs/common';
import { SOC } from '../models/standar/soc.entity';
import { MeddraSocService } from '../services/meddra-soc.service';
import { MeddraPtService } from '../services/meddra-pt-service';
import { PT } from '../models/standar/pt.entity';

@Controller({ path: 'meddra/pt', version: '1' })
export class MeddraPtController {
  constructor(private readonly meddraPtService: MeddraPtService) {}

  // Endpoint para buscar PTs
  @Get('search')
  async searchPT(@Query('term') term: string): Promise<PT[]> {
    return this.meddraPtService.searchPT(term);
  }
}
