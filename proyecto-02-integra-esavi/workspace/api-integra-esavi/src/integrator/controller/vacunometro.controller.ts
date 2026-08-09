import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { KeycloakAuthGuard } from '../../common/guards/keycloak-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { IController, Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { VacunometroCreateDto, VacunometroDto, VacunometroUpdateDto } from '../dto/vacunometro.dto';
import { VacunometroService } from '../service';

/**
 *
 */
@ApiTags('Vacunometro')
@ApiBearerAuth('keycloak-jwt')
@UseGuards(KeycloakAuthGuard, RolesGuard)
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
  @Roles('admin')
  @Post('create')
  public create(@Body() data: any): Promise<any> {
    return this.vacunometroService.create(data);
  }

  /**
   *
   */
  @Roles('admin')
  @Put('update/:id')
  public update(@Param('id', ParseUUIDPipe) id: Identificator, @Body() data: any): Promise<any> {
    return this.vacunometroService.update(id, data);
  }

  /**
   *
   */
  @Roles('admin')
  @Delete('delete/:id')
  public delete(@Param('id', ParseUUIDPipe) id: Identificator, auditData: any): Promise<VacunometroDto> {
    return this.vacunometroService.delete(id, auditData);
  }
}
