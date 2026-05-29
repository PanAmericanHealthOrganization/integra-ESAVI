import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags} from '@nestjs/swagger';
import { Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { InvestigacionCreateDto, InvestigacionDto, InvestigacionUpdateDto } from '../entity/investigacion.entity';//'../dto/investigacion.dto';
import { InvestigacionService, IControllerCreateOmit } from '../service/investigacion.service';
import { Notificacion } from '../entity/notificacion.entity';

//--Se recomienda usar las interfaces icontroller y la iservice,
//que se encuentran en src/utils/IController.ts
@ApiTags('Investigacion')
@Controller({ path: 'integrator/investigacion', version: '1' })
export class InvestigacionController 
  implements IControllerCreateOmit<InvestigacionCreateDto, InvestigacionDto, InvestigacionUpdateDto>
{
    constructor(private readonly investigacionService: InvestigacionService) {}

  /**
   *
   */
  @Get(':id')
  public getOne(@Param('id') id: Identificator): Promise<any> {
    return this.investigacionService.getOne(id);
  }

  /**
   *
   * @param params
   * @returns
   */
  @Post('getMany')
  public getMany(@Body() params: IGetManyParams): Promise<any[]> {
    return this.investigacionService.getMany(params);
  }

  /**
   *
   */
  @Post('paginated')
  public getPaginated(@Body() params: GetListParams): Promise<{ data: any[]; total: number }> {
    return this.investigacionService.getPaginated(params);
  }

  /**
   *
   */
  /*@Post('create')
  public create(@Body() data: any): Promise<any> {
    return this.investigacionService.create(data);
  }*/
  @Post('create')
  public create(
    @Body() investigacionCreateDto: InvestigacionCreateDto,
    @Body() notificacion: Notificacion,
  ): Promise<any> {
    return this.investigacionService.create(investigacionCreateDto, notificacion);
  }

  /**
   *
   */
  @Put('update/:id')
  public update(@Param('id') id: Identificator, @Body() data: any): Promise<any> {
    return this.investigacionService.update(id, data);
  }

  /**
   *
   */
  @Delete('delete/:id')
  public delete(id: Identificator, auditData: any): Promise<InvestigacionDto> {
    return this.investigacionService.delete(id, auditData);
  }
}
