import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { CreateHomologationDto } from '../dto/create-homologation.dto';
import { UpdateHomologationDto } from '../dto/update-homologation.dto';
import { HomologationService } from '../service/homologation.service';

@ApiTags('Homologation')
@Controller({ path: 'integrator/homologation', version: '1' })
export class HomologationController {
  constructor(private readonly homologationService: HomologationService) {}

  @Get('getOne/:id')
  @ApiOperation({ summary: 'Obtener homologation por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  getOne(@Param('id') id: Identificator) {
    return this.homologationService.getOne(id);
  }

  @Post('getMany')
  @ApiOperation({ summary: 'Obtener múltiples homologations por IDs' })
  getMany(@Body() params: IGetManyParams) {
    return this.homologationService.getMany(params);
  }

  @Post('paginated')
  @ApiOperation({ summary: 'Listar homologations con paginación y filtros (soporta filtro por homologatorId)' })
  getPaginated(@Body() params: GetListParams) {
    return this.homologationService.getPaginated(params);
  }

  @Post('create')
  @ApiOperation({ summary: 'Crear regla de homologación' })
  create(@Body() dto: CreateHomologationDto) {
    return this.homologationService.create(dto);
  }

  @Put('update/:id')
  @ApiOperation({ summary: 'Actualizar regla de homologación' })
  @ApiParam({ name: 'id', format: 'uuid' })
  update(@Param('id') id: Identificator, @Body() dto: UpdateHomologationDto) {
    return this.homologationService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar regla de homologación (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  delete(@Param('id') id: Identificator, @Body() auditData: any) {
    return this.homologationService.delete(id, auditData);
  }
}
