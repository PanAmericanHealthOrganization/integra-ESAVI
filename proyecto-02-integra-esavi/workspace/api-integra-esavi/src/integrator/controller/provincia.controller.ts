import { Body, Controller, Delete, Get, Headers, Param, Post, Put } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateProvinciaDto, UpdateProvinciaDto } from '../dto/provincia.dto';
import { ProvinciaService } from '../service/provincia.service';

@ApiTags('Provincia')
@Controller({ path: 'integrator/provincias', version: '1' })
export class ProvinciaController {
  constructor(private readonly provinciaService: ProvinciaService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Listado de provincias.' })
  findAll() {
    return this.provinciaService.findAll();
  }

  @Get(':codigo')
  @ApiResponse({ status: 200, description: 'Provincia encontrada.' })
  @ApiResponse({ status: 404, description: 'Provincia no encontrada.' })
  findOne(@Param('codigo') codigo: string) {
    return this.provinciaService.findOne(codigo);
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Provincia creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Error al crear la provincia.' })
  create(@Body() body: CreateProvinciaDto, @Headers('x-username') username: string) {
    return this.provinciaService.create(body, username);
  }

  @Put(':codigo')
  @ApiResponse({ status: 200, description: 'Provincia actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Provincia no encontrada.' })
  update(
    @Param('codigo') codigo: string,
    @Body() body: UpdateProvinciaDto,
    @Headers('x-username') username: string,
  ) {
    return this.provinciaService.update(codigo, body, username);
  }

  @Delete(':codigo')
  @ApiResponse({ status: 200, description: 'Provincia eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Provincia no encontrada.' })
  delete(@Param('codigo') codigo: string, @Headers('x-username') username: string) {
    return this.provinciaService.delete(codigo, username);
  }
}
