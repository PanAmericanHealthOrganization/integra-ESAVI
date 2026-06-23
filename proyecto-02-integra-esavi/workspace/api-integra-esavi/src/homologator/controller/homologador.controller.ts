import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { CrearHomologadorDto, ActualizarHomologadorDto, SolicitudResolucionDto } from '../dto';
import { HomologadorService } from '../service/homologador.service';
import { ResolutorService } from '../service/resolutor.service';

@ApiTags('Homologador')
@Controller({ path: 'integrator/homologator', version: '1' })
export class HomologadorController {
  constructor(
    private readonly homologadorService: HomologadorService,
    private readonly resolutorService: ResolutorService,
  ) {}

  @Get('getOne/:id')
  @ApiOperation({ summary: 'Obtener homologador por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  obtenerUno(@Param('id') id: Identificator) {
    return this.homologadorService.obtenerUno(id);
  }

  @Post('getMany')
  @ApiOperation({ summary: 'Obtener múltiples homologadores por IDs' })
  obtenerVarios(@Body() params: IGetManyParams) {
    return this.homologadorService.obtenerVarios(params);
  }

  @Post('paginated')
  @ApiOperation({ summary: 'Listar homologadores con paginación y filtros' })
  obtenerPaginado(@Body() params: GetListParams) {
    return this.homologadorService.obtenerPaginado(params);
  }

  @Post('create')
  @ApiOperation({ summary: 'Crear homologador' })
  crear(@Body() dto: CrearHomologadorDto) {
    return this.homologadorService.crear(dto);
  }

  @Put('update/:id')
  @ApiOperation({ summary: 'Actualizar homologador' })
  @ApiParam({ name: 'id', format: 'uuid' })
  actualizar(@Param('id') id: Identificator, @Body() dto: ActualizarHomologadorDto) {
    return this.homologadorService.actualizar(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar homologador (soft delete)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  eliminar(@Param('id') id: Identificator, @Body() auditData: any) {
    return this.homologadorService.eliminar(id, auditData);
  }

  @Post('resolve')
  @ApiOperation({ summary: 'Resolver un valor de origen al valor homologado destino' })
  resolver(@Body() dto: SolicitudResolucionDto) {
    return this.resolutorService.resolver(dto);
  }
}
