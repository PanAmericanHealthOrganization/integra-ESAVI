import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  IController,
  Identificator,
  IGetManyParams,
} from 'src/utils/IController';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { VacunometroService } from '../service';
import { ApiTags } from '@nestjs/swagger';

/**
 *
 */
@ApiTags('Vacunometro')
@Controller({ path: 'vacunometro', version: '1' })
export class VacunometroController implements IController<any, any, any> {
  constructor(private readonly vacunometroService: VacunometroService) {}

  /**
   *
   */
  @Get(':id')
  public getOne(@Param('id') id: Identificator): Promise<any> {
    return this.vacunometroService.getOne(id);
  }

  /**
   *
   * @param params
   * @returns
   */
  @Post('getMany')
  public getMany(@Body() params: IGetManyParams): Promise<any[]> {
    return this.vacunometroService.getMany(params);
  }

  /**
   *
   */
  @Post('getPaginated')
  public getPaginated(
    @Body() params: GetListParams,
  ): Promise<{ data: any[]; total: number }> {
    return this.vacunometroService.getPaginated(params);
  }

  /**
   *
   */
  @Post('create')
  public create(@Body() data: any): Promise<any> {
    return this.vacunometroService.create(data);
  }

  /**
   *
   */
  @Put('update/:id')
  public update(
    @Param('id') id: Identificator,
    @Body() data: any,
  ): Promise<any> {
    return this.vacunometroService.update(id, data);
  }

  /**
   *
   */
  @Delete('delete/:id')
  public delete(id: Identificator, auditData: any): Promise<void> {
    return this.vacunometroService.delete(id, auditData);
  }
}
