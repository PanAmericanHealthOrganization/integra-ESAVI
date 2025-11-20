import { Controller, Delete, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SeedService } from '../service/seed.service';

/**
 *
 */
@ApiTags('Seed')
@Controller({ path: 'seed', version: '1' })
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cargar datos de ejemplo y catálogos de homologación' })
  @ApiResponse({ status: 200, description: 'Datos cargados exitosamente' })
  async seedData() {
    await this.seedService.seedData();
    return {
      message:
        'Controlador del semillero: Valores cargados exitosamente en el catálogo de homologación.',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Limpiar datos existentes (TRUNCATE)' })
  @ApiResponse({ status: 200, description: 'Datos limpiados exitosamente' })
  async cleanData() {
    await this.seedService.cleanData();
    return {
      message: 'Datos limpiados exitosamente',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('tr-tables')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Limpiar contenido de todas las tablas que inician con "TR"' })
  @ApiResponse({ status: 200, description: 'Contenido de tablas TR limpiado exitosamente' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async cleanTRTables() {
    await this.seedService.cleanTRTables();
    return {
      message:
        'El contenido de todas las tablas que inician con "TR" ha sido limpiado exitosamente',
      timestamp: new Date().toISOString(),
    };
  }
}
