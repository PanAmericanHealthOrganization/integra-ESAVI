import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { getUsernameFromJwt } from 'src/common/utils/jwt.util';
import { CreateEstablecimientoDto, UpdateEstablecimientoDto } from '../dto/establecimiento.dto';
import { EstablecimientosService } from '../service/establecimientos.service';

@ApiTags('Establecimiento')
@ApiBearerAuth('keycloak-jwt')
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
  create(@Body() body: CreateEstablecimientoDto, @Req() req: Request) {
    this.logger.log(`POST body recibido: ${JSON.stringify(body)}`);
    return this.establecimientosService.create(body, getUsernameFromJwt(req.headers.authorization));
  }

  @Put(':id')
  @ApiResponse({ status: 200, description: 'Establecimiento actualizado exitosamente.' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateEstablecimientoDto,
    @Req() req: Request,
  ) {
    this.logger.log(`PUT /${id} body recibido: ${JSON.stringify(body)}`);
    return this.establecimientosService.update(id, body, getUsernameFromJwt(req.headers.authorization));
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Establecimiento eliminado exitosamente.' })
  delete(@Param('id') id: string, @Req() req: Request) {
    return this.establecimientosService.delete(id, getUsernameFromJwt(req.headers.authorization));
  }
}
