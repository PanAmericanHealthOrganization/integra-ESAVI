import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { IController, Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { CreateGacetaDto } from '../dto/create-gaceta.dto';
import { GacetaDto } from '../dto/gaceta.dto';
import { UpdateGacetaDto } from '../dto/update-gaceta.dto';
import { ESTADO_GACETA } from '../entity/interfaces/gaceta.interface';
import { GacetaService } from '../service/gaceta.service';

/**
 * Controlador para la gestión de gacetas de eventos adversos
 */
@ApiTags('Gaceta')
@Controller({ path: 'integrator/gaceta', version: '1' })
export class GacetaController implements IController<CreateGacetaDto, GacetaDto, UpdateGacetaDto> {
  constructor(private readonly gacetaService: GacetaService) {}

  /**
   * Descargar archivo PDF de la gaceta
   */
  @Get('pdf')
  @ApiOperation({ summary: 'Descargar archivo PDF de la gaceta' })
  @ApiParam({
    name: 'filename',
    description: 'Nombre del archivo PDF',
    example: 'asdf_202501.pdf',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo PDF descargado exitosamente',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  public async getPdfInforme(
    @Query('anio') anio: number,
    @Query('mes') mes: number,
    @Res() res: Response,
  ): Promise<void> {
    if (!anio || !mes) {
      throw new BadRequestException('Parámetros "anio" y "mes" son obligatorios');
    }
    const file = await this.gacetaService.getPdfInforme(anio, mes);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="gaceta_${anio}_${mes}.pdf"`);
    res.send(file);
  }

  /**
   * Obtener una gaceta por ID
   */
  @Get('getOne/:id')
  @ApiOperation({ summary: 'Obtener gaceta por ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID de la gaceta',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  public getOne(@Param('id') id: Identificator): Promise<GacetaDto> {
    return this.gacetaService.getOne(id);
  }

  /**
   * Obtener múltiples gacetas por IDs
   */
  @Post('getMany')
  @ApiOperation({ summary: 'Obtener múltiples gacetas por IDs' })
  public getMany(@Body() params: IGetManyParams): Promise<GacetaDto[]> {
    return this.gacetaService.getMany(params);
  }

  /**
   * Obtener gacetas paginadas con filtros
   */
  @Post('paginated')
  @ApiOperation({ summary: 'Obtener gacetas paginadas con filtros y ordenamiento' })
  @ApiResponse({
    status: 200,
    description: 'Gacetas obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/GacetaDto' },
        },
        total: {
          type: 'number',
          description: 'Total de registros',
        },
      },
    },
  })
  public getPaginated(
    @Body() params: GetListParams,
  ): Promise<{ data: GacetaDto[]; total: number }> {
    return this.gacetaService.getPaginated(params);
  }

  /**
   * Obtener todas las gacetas
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todas las gacetas' })
  @ApiResponse({
    status: 200,
    description: 'Gacetas obtenidas exitosamente',
    type: [GacetaDto],
  })
  public findAll(): Promise<GacetaDto[]> {
    return this.gacetaService.findAll();
  }

  /**
   * Crear nueva gaceta
   */
  @Post('create')
  @ApiOperation({ summary: 'Crear nueva gaceta' })
  @ApiResponse({
    status: 201,
    description: 'Gaceta creada exitosamente',
    type: GacetaDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 409, description: 'Ya existe una gaceta con los mismos datos' })
  public create(@Body() createGacetaDto: CreateGacetaDto): Promise<GacetaDto> {
    return this.gacetaService.create(createGacetaDto);
  }

  /**
   * Actualizar gaceta existente
   */
  @Put('update/:id')
  @ApiOperation({ summary: 'Actualizar gaceta existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID único de la gaceta a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Gaceta actualizada exitosamente',
    type: GacetaDto,
  })
  @ApiResponse({ status: 404, description: 'Gaceta no encontrada' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  public update(
    @Param('id') id: Identificator,
    @Body() updateGacetaDto: UpdateGacetaDto,
  ): Promise<GacetaDto> {
    return this.gacetaService.update(id, updateGacetaDto);
  }

  /**
   * Eliminar gaceta (soft delete)
   */
  @Delete('delete/:id')
  @ApiOperation({ summary: 'Eliminar gaceta (marcado como cancelado)' })
  @ApiParam({
    name: 'id',
    description: 'UUID único de la gaceta a eliminar',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Gaceta eliminada exitosamente',
    type: GacetaDto,
  })
  @ApiResponse({ status: 404, description: 'Gaceta no encontrada' })
  public delete(@Param('id') id: Identificator, @Body() auditData: any): Promise<GacetaDto> {
    return this.gacetaService.delete(id, auditData);
  }

  /**
   * Buscar gacetas por período (año y opcionalmente mes)
   */
  @Get('periodo/:anio')
  @ApiOperation({ summary: 'Buscar gacetas por año' })
  @ApiParam({ name: 'anio', description: 'Año de búsqueda', example: 2024 })
  @ApiQuery({
    name: 'mes',
    description: 'Mes de búsqueda (opcional)',
    required: false,
    example: 11,
  })
  @ApiResponse({
    status: 200,
    description: 'Gacetas encontradas por período',
    type: [GacetaDto],
  })
  public findByPeriodo(
    @Param('anio') anio: number,
    @Query('mes') mes?: number,
  ): Promise<GacetaDto[]> {
    return this.gacetaService.findByPeriodo(anio, mes);
  }

  /**
   * Buscar gacetas por estado
   */
  @Get('estado/:estado')
  @ApiOperation({ summary: 'Buscar gacetas por estado' })
  @ApiParam({
    name: 'estado',
    description: 'Estado de la gaceta',
    enum: ['PUBLICADO', 'PENDIENTE', 'CANCELADO'],
    example: 'PUBLICADO',
  })
  @ApiResponse({
    status: 200,
    description: 'Gacetas encontradas por estado',
    type: [GacetaDto],
  })
  public findByEstado(@Param('estado') estado: ESTADO_GACETA): Promise<GacetaDto[]> {
    return this.gacetaService.findByEstado(estado);
  }
}
