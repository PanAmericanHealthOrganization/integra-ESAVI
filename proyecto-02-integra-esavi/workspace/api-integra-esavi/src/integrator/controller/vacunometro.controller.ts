import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IController, Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { VacunometroCreateDto, VacunometroDto, VacunometroUpdateDto } from '../dto/vacunometro.dto';
import { VacunometroService } from '../service';

/**
 *
 */
@ApiTags('Vacunometro')
@Controller({ path: 'integrator/vacunometro', version: '1' })
export class VacunometroController implements IController<VacunometroCreateDto, VacunometroDto, VacunometroUpdateDto> {
  constructor(private readonly vacunometroService: VacunometroService) {}

  /**
   *
   */
  @Get('findone')
  public async getOne(@Query('id') id: Identificator): Promise<any> {
    return await this.vacunometroService.getOne(id);
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
  @Post('paginated')
  public getPaginated(@Body() params: GetListParams): Promise<{ data: any[]; total: number }> {
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
  public update(@Param('id', ParseUUIDPipe) id: Identificator, @Body() data: any): Promise<any> {
    return this.vacunometroService.update(id, data);
  }

  /**
   *
   */
  @Delete('delete/:id')
  public delete(@Param('id', ParseUUIDPipe) id: Identificator, auditData: any): Promise<VacunometroDto> {
    return this.vacunometroService.delete(id, auditData);
  }
}
