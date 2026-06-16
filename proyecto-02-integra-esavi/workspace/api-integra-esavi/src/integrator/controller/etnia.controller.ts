import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateEtniaDto } from '../dto/create-etnia.dto';
import { UpdateEtniaDto } from '../dto/update-etnia.dto';
import { EtniaService } from '../service/etnia.service';

@ApiTags('Etnia')
@Controller({ path: 'integrator/etnia', version: '1' })
export class EtniaController {
  constructor(private readonly etniaService: EtniaService) {}

  @Get('/findAll')
  @ApiOperation({ summary: 'Obtener todas las etnias activas' })
  @ApiResponse({ status: 200, description: 'Lista de etnias obtenida exitosamente.' })
  findAll() {
    return this.etniaService.findAll();
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Obtener una etnia por ID' })
  @ApiResponse({ status: 200, description: 'Etnia encontrada.' })
  @ApiResponse({ status: 404, description: 'Etnia no encontrada.' })
  findOne(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
    return this.etniaService.findOne(uuid);
  }

  @Post('/create')
  @ApiOperation({ summary: 'Crear una nueva etnia' })
  @ApiResponse({ status: 201, description: 'Etnia creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(@Body() body: CreateEtniaDto) {
    return this.etniaService.create(body);
  }

  @Patch(':uuid')
  @ApiOperation({ summary: 'Actualizar parcialmente una etnia existente' })
  @ApiResponse({ status: 200, description: 'Etnia actualizada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Etnia no encontrada.' })
  update(@Param('uuid', new ParseUUIDPipe()) uuid: string, @Body() body: UpdateEtniaDto) {
    return this.etniaService.update(uuid, body);
  }

  @Delete(':uuid')
  @ApiOperation({ summary: 'Eliminar (soft delete) una etnia' })
  @ApiResponse({ status: 200, description: 'Etnia eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Etnia no encontrada.' })
  remove(@Param('uuid', new ParseUUIDPipe()) uuid: string, @Query('deletedBy') deletedBy: string) {
    return this.etniaService.remove(uuid, deletedBy ?? 'SYSTEM');
  }
}
