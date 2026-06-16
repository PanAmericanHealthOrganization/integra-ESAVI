import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { LLT } from '../models/standar/llt.entity';
import { MeddraLLTService } from '../services/meddra-lt.service';

@ApiTags('llt', 'Meddra Standar')
@Controller({ path: 'meddra/llt', version: '1' })
export class MeddraLltController {
  constructor(private readonly meddraLltService: MeddraLLTService) {}

  @Get('list')
  @ApiQuery({ name: 'ptCode', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'size', required: false })
  async listLLTs(
    @Query('ptCode') ptCode: string,
    @Query('page') page = 0,
    @Query('size') size = 200,
  ): Promise<{ data: LLT[]; total: number }> {
    return this.meddraLltService.listLLTs(ptCode, +page, +size);
  }

  @Get('search')
  async searchLLT(@Query('term') term: string): Promise<LLT> {
    return this.meddraLltService.searchLLT(term);
  }
}
