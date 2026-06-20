import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query } from '@nestjs/common';
import { ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateParroquiaDto, UpdateParroquiaDto } from '../dto/parroquia.dto';
import { ParroquiaService } from '../service/parroquia.service';

@ApiTags('Parroquia')
@Controller({ path: 'integrator/parroquias', version: '1' })
export class ParroquiaController {
  constructor(private readonly parroquiaService: ParroquiaService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Listado de parroquias.' })
  @ApiQuery({ name: 'canton', required: false, description: 'Filtrar por código de cantón' })
  findAll(@Query('canton') canton?: string) {
    if (canton) {
      return this.parroquiaService.findByCanton(canton);
    }
    return this.parroquiaService.findAll();
  }

  @Get(':codigo')
  @ApiResponse({ status: 200, description: 'Parroquia encontrada.' })
  @ApiResponse({ status: 404, description: 'Parroquia no encontrada.' })
  findOne(@Param('codigo') codigo: string) {
    return this.parroquiaService.findOne(codigo);
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Parroquia creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Error al crear la parroquia.' })
  create(@Body() body: CreateParroquiaDto, @Headers('x-username') username: string) {
    return this.parroquiaService.create(body, username);
  }

  @Put(':codigo')
  @ApiResponse({ status: 200, description: 'Parroquia actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Parroquia no encontrada.' })
  update(
    @Param('codigo') codigo: string,
    @Body() body: UpdateParroquiaDto,
    @Headers('x-username') username: string,
  ) {
    return this.parroquiaService.update(codigo, body, username);
  }

  @Delete(':codigo')
  @ApiResponse({ status: 200, description: 'Parroquia eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Parroquia no encontrada.' })
  delete(@Param('codigo') codigo: string, @Headers('x-username') username: string) {
    return this.parroquiaService.delete(codigo, username);
  }
}
