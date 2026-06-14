import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { CreateHomologatorDto } from '../dto/create-homologator.dto';
import { UpdateHomologatorDto } from '../dto/update-homologator.dto';
import { ResolveRequestDto } from '../dto/resolve-request.dto';
import { HomologatorService } from '../service/homologator.service';
import { ResolverService } from '../service/resolver.service';

@ApiTags('Homologator')
@Controller({ path: 'integrator/homologator', version: '1' })
export class HomologatorController {
  constructor(
    private readonly homologatorService: HomologatorService,
    private readonly resolverService: ResolverService,
  ) {}

  @Get('getOne/:id')
  @ApiOperation({ summary: 'Obtener homologator por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  getOne(@Param('id') id: Identificator) {
    return this.homologatorService.getOne(id);
  }

  @Post('getMany')
  @ApiOperation({ summary: 'Obtener múltiples homologators por IDs' })
  getMany(@Body() params: IGetManyParams) {
    return this.homologatorService.getMany(params);
  }

  @Post('paginated')
  @ApiOperation({ summary: 'Listar homologators con paginación y filtros' })
  getPaginated(@Body() params: GetListParams) {
    return this.homologatorService.getPaginated(params);
  }

  @Post('create')
  @ApiOperation({ summary: 'Crear homologator' })
  create(@Body() dto: CreateHomologatorDto) {
    return this.homologatorService.create(dto);
  }

  @Put('update/:id')
  @ApiOperation({ summary: 'Actualizar homologator' })
  @ApiParam({ name: 'id', format: 'uuid' })
  update(@Param('id') id: Identificator, @Body() dto: UpdateHomologatorDto) {
    return this.homologatorService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar homologator (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  delete(@Param('id') id: Identificator, @Body() auditData: any) {
    return this.homologatorService.delete(id, auditData);
  }

  @Post('resolve')
  @ApiOperation({ summary: 'Resolver un valor de origen al valor homologado destino' })
  resolve(@Body() dto: ResolveRequestDto) {
    return this.resolverService.resolve(dto);
  }
}
