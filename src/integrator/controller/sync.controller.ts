import { Body, Controller, Delete, Get, Logger, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IController, Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { CreateSyncDto, SyncDto, UpdateSyncDto } from '../dto/sync.dto';
import { SyncService } from '../service';
/**
 *
 */
@ApiTags('Procesos de sincronización Sync')
@Controller({ path: 'integrator/syncs' })
export class SyncController implements IController<CreateSyncDto, SyncDto, UpdateSyncDto> {
  constructor(private readonly syncService: SyncService) {}
  private readonly logger = new Logger(SyncController.name);

  /**
   *
   * @param params
   * @returns
   */
  @Get('getMany')
  public async getMany(@Body() params: IGetManyParams): Promise<SyncDto[]> {
    return this.syncService.getMany(params);
  }

  /**
   *
   * @param params
   * @returns
   */
  @Delete(':id')
  public async delete(@Param('id') id: Identificator, auditData: any): Promise<SyncDto> {
    return this.syncService.delete(id, auditData);
  }

  /**
   *
   * @param params
   * @returns
   */
  @Get(':id')
  public async getOne(@Param('id') id: Identificator): Promise<SyncDto> {
    return this.syncService.getOne(id as string);
  }

  /**
   *
   * @param params
   * @returns
   */
  @Post('/paginated')
  public async getPaginated(
    @Body() params: GetListParams,
  ): Promise<{ data: SyncDto[]; total: number }> {
    return this.syncService.getPaginated(params);
  }

  /**
   *
   * @param params
   * @returns
   */
  @Post('create')
  public async create(data: CreateSyncDto): Promise<SyncDto> {
    return this.syncService.create(data);
  }

  /**
   *
   * @param params
   * @returns
   */
  @Put(':id')
  public async update(id: Identificator, data: UpdateSyncDto): Promise<SyncDto> {
    return this.syncService.update(id, data);
  }
}
