import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LLT } from '../models/standar/llt.entity';
import { MeddraLLTService } from '../services/meddra-lt-service';

/**
 *
 */
@ApiTags('hlt', 'Meddra Standar')
@Controller({ path: 'meddra/llt', version: '1' })
export class MeddraLltController {
  constructor(private readonly meddraLltService: MeddraLLTService) {}

  // Endpoint para buscar PTs
  @Get('search')
  async searchLLT(@Query('term') term: string): Promise<LLT[]> {
    return this.meddraLltService.searchLLT(term);
  }
}
