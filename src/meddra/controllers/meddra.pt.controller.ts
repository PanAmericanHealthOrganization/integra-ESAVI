import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PT } from '../models/standar/pt.entity';
import { MeddraPtService } from '../services/meddra-pt-service';

/**
 *
 */
@ApiTags('pt', 'Meddra Standar')
@Controller({ path: 'meddra/pt', version: '1' })
export class MeddraPtController {
  constructor(private readonly meddraPtService: MeddraPtService) {}

  // Endpoint para buscar PTs
  @Get('search')
  async searchPT(@Query('term') term: string): Promise<PT> {
    return this.meddraPtService.searchPT(term);
  }
}
