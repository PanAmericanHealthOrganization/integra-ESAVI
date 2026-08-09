import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags} from '@nestjs/swagger';
import { Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { Roles } from '../../common/decorators/roles.decorator';
import { KeycloakAuthGuard } from '../../common/guards/keycloak-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InvestigacionCreateDto, InvestigacionDto, InvestigacionUpdateDto } from '../entity/investigacion.entity';//'../dto/investigacion.dto';
import { InvestigacionService, IControllerCreateOmit } from '../service/investigacion.service';
import { Notificacion } from '../entity/notificacion.entity';

//--Se recomienda usar las interfaces icontroller y la iservice,
//que se encuentran en src/utils/IController.ts
/**
 * Investigación de casos ESAVI. El rol se anota endpoint por endpoint y no por verbo: aquí
 * `getMany` y `paginated` son consultas que usan POST sólo para mandar los filtros en el
 * cuerpo, así que quedan como lectura.
 */
@ApiTags('Investigacion')
@ApiBearerAuth('keycloak-jwt')
@UseGuards(KeycloakAuthGuard, RolesGuard)
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
  @Roles('admin')
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
  @Roles('admin')
  @Put('update/:id')
  public update(@Param('id') id: Identificator, @Body() data: any): Promise<any> {
    return this.investigacionService.update(id, data);
  }

  /**
   *
   */
  @Roles('admin')
  @Delete('delete/:id')
  public delete(id: Identificator, auditData: any): Promise<InvestigacionDto> {
    return this.investigacionService.delete(id, auditData);
  }
}
