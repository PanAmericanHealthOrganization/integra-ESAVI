import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateGeneroDto } from '../dto/create-genero.dto';
import { UpdateGeneroDto } from '../dto/update-genero.dto';
import { GeneroService } from '../service/genero.service';

@ApiTags('Genero')
@Controller({ path: 'integrator/genero', version: '1' })
export class GeneroController {
  constructor(private readonly generoService: GeneroService) {}

  @Get('/findAll')
  @ApiOperation({ summary: 'Obtener todos los géneros activos' })
  @ApiResponse({ status: 200, description: 'Lista de géneros obtenida exitosamente.' })
  findAll() {
    return this.generoService.findAll();
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Obtener un género por ID' })
  @ApiResponse({ status: 200, description: 'Género encontrado.' })
  @ApiResponse({ status: 404, description: 'Género no encontrado.' })
  findOne(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
    return this.generoService.findOne(uuid);
  }

  @Post('/create')
  @ApiOperation({ summary: 'Crear un nuevo género' })
  @ApiResponse({ status: 201, description: 'Género creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(@Body() body: CreateGeneroDto) {
    return this.generoService.create(body);
  }

  @Patch(':uuid')
  @ApiOperation({ summary: 'Actualizar parcialmente un género existente' })
  @ApiResponse({ status: 200, description: 'Género actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Género no encontrado.' })
  update(@Param('uuid', new ParseUUIDPipe()) uuid: string, @Body() body: UpdateGeneroDto) {
    return this.generoService.update(uuid, body);
  }

  @Delete(':uuid')
  @ApiOperation({ summary: 'Eliminar (soft delete) un género' })
  @ApiResponse({ status: 200, description: 'Género eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Género no encontrado.' })
  remove(@Param('uuid', new ParseUUIDPipe()) uuid: string, @Query('deletedBy') deletedBy: string) {
    return this.generoService.remove(uuid, deletedBy ?? 'SYSTEM');
  }
}
