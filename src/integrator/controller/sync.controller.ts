import { Controller, Get } from '@nestjs/common';
import {
  IPaginationRequest,
  IPaginationResponse,
} from 'src/utils/interfaces/pagination';
import { SyncProcess } from '../entity';
import { SyncService } from '../service';
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /**
   *
   * @param params
   * @returns
   */
  @Get('/many')
  public async getMany(
    params: IPaginationRequest<SyncProcess>,
  ): Promise<IPaginationResponse<SyncProcess[]>> {
    try {
      return this.syncService.getMany(params);
    } catch (error) {
      console.error('Error fetching sync processes:', error);
      throw error;
    }
  }

  /**
   *
   * @param id
   * @returns
   */
  @Get('/:id')
  public async getOne(id: string): Promise<SyncProcess> {
    return this.syncService.getOne(id);
  }

  /**
   *
   * @returns
   */
  @Get('/list')
  public async getList(): Promise<SyncProcess[]> {
    return this.syncService.getList();
  }
}
