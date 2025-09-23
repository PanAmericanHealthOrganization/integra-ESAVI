import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
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
export class VacunometroController
  implements IController<VacunometroCreateDto, VacunometroDto, VacunometroUpdateDto>
{
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
  public getPaginated(@Body() params: GetListParams): Promise<{ data: any[]; total: number }> {
    console.log(params);
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
  public update(@Param('id') id: Identificator, @Body() data: any): Promise<any> {
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
