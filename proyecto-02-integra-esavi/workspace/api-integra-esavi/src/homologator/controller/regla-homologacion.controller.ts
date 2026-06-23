import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { CrearReglaHomologacionDto, ActualizarReglaHomologacionDto } from '../dto';
import { ReglaHomologacionService } from '../service/regla-homologacion.service';

@ApiTags('ReglaHomologacion')
@Controller({ path: 'integrator/homologation', version: '1' })
export class ReglaHomologacionController {
  constructor(private readonly reglaHomologacionService: ReglaHomologacionService) {}

  @Get('getOne/:id')
  @ApiOperation({ summary: 'Obtener regla de homologación por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  obtenerUna(@Param('id') id: Identificator) {
    return this.reglaHomologacionService.obtenerUna(id);
  }

  @Post('getMany')
  @ApiOperation({ summary: 'Obtener múltiples reglas de homologación por IDs' })
  obtenerVarias(@Body() params: IGetManyParams) {
    return this.reglaHomologacionService.obtenerVarias(params);
  }

  @Post('paginated')
  @ApiOperation({ summary: 'Listar reglas de homologación con paginación y filtros' })
  obtenerPaginado(@Body() params: GetListParams) {
    return this.reglaHomologacionService.obtenerPaginado(params);
  }

  @Post('create')
  @ApiOperation({ summary: 'Crear regla de homologación' })
  crear(@Body() dto: CrearReglaHomologacionDto) {
    return this.reglaHomologacionService.crear(dto);
  }

  @Put('update/:id')
  @ApiOperation({ summary: 'Actualizar regla de homologación' })
  @ApiParam({ name: 'id', format: 'uuid' })
  actualizar(@Param('id') id: Identificator, @Body() dto: ActualizarReglaHomologacionDto) {
    return this.reglaHomologacionService.actualizar(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar regla de homologación (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  eliminar(@Param('id') id: Identificator, @Body() auditData: any) {
    return this.reglaHomologacionService.eliminar(id, auditData);
  }
}
