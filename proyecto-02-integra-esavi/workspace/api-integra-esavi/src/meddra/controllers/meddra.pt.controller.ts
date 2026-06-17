import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { PT } from '../models/standar/pt.entity';
import { MeddraPtService } from '../services/meddra-pt.service';

@ApiTags('pt', 'Meddra Standar')
@Controller({ path: 'meddra/pt', version: '1' })
export class MeddraPtController {
  constructor(private readonly meddraPtService: MeddraPtService) {}

  @Get('list')
  @ApiQuery({ name: 'socCode', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'size', required: false })
  @ApiQuery({ name: 'term', required: false })
  async listPTs(
    @Query('socCode') socCode: string,
    @Query('page') page = 0,
    @Query('size') size = 100,
    @Query('term') term?: string,
  ): Promise<{ data: PT[]; total: number }> {
    return this.meddraPtService.listPTs(socCode, +page, +size, term);
  }

  @Get('search')
  async searchPT(@Query('term') term: string): Promise<PT> {
    return this.meddraPtService.searchPT(term);
  }
}
