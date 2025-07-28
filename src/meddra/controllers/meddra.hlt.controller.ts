import { Controller, Get, Query } from '@nestjs/common';
import { SOC } from '../models/standar/soc.entity';
import { MeddraSocService } from '../services/meddra-soc.service';
import { MeddraPtService } from '../services/meddra-pt-service';
import { PT } from '../models/standar/pt.entity';
import { MeddraLLTService } from '../services/meddra-lt-service';
import { LLT } from '../models/standar/llt.entity';

@Controller({ path: 'meddra/llt', version: '1' })
export class MeddraLltController {
  constructor(private readonly meddraLltService: MeddraLLTService) {}

  // Endpoint para buscar PTs
  @Get('search')
  async searchLLT(@Query('term') term: string): Promise<LLT[]> {
    return this.meddraLltService.searchLLT(term);
  }
}
