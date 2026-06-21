import { Body, Controller, Delete, Get, Headers, Logger, Param, Post, Put, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateEstablecimientoDto, UpdateEstablecimientoDto } from '../dto/establecimiento.dto';
import { EstablecimientosService } from '../service/establecimientos.service';

@ApiTags('Establecimiento')
@Controller({ path: 'integrator/establecimientos', version: '1' })
export class EstablecimientoController {
  private readonly logger = new Logger(EstablecimientoController.name);

  constructor(private readonly establecimientosService: EstablecimientosService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Listado de establecimientos.' })
  @ApiQuery({ name: 'parroquia', required: false })
  findAll() {
    return this.establecimientosService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Establecimiento encontrado.' })
  @ApiResponse({ status: 404, description: 'Establecimiento no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.establecimientosService.findOne(id);
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Establecimiento creado exitosamente.' })
  create(@Body() body: CreateEstablecimientoDto, @Headers('x-username') username: string) {
    this.logger.log(`POST body recibido: ${JSON.stringify(body)}`);
    return this.establecimientosService.create(body, username);
  }

  @Put(':id')
  @ApiResponse({ status: 200, description: 'Establecimiento actualizado exitosamente.' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateEstablecimientoDto,
    @Headers('x-username') username: string,
  ) {
    this.logger.log(`PUT /${id} body recibido: ${JSON.stringify(body)}`);
    return this.establecimientosService.update(id, body, username);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Establecimiento eliminado exitosamente.' })
  delete(@Param('id') id: string, @Headers('x-username') username: string) {
    return this.establecimientosService.delete(id, username);
  }
}
