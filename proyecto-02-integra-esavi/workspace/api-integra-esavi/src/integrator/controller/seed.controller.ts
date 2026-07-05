import { Controller, Delete, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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

  @Post('vacunometro')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar datos simulados de vacunómetro (TR_VACUNOMETRO)',
    description:
      'Inserta registros aleatorios de conteo de vacunas para pruebas y demos, usando unicodigos reales de TR_ESTABLECIMIENTO cuando existen.',
  })
  @ApiQuery({ name: 'registros', required: false, description: 'Cantidad de registros a generar (default 1000)' })
  @ApiQuery({ name: 'dias', required: false, description: 'Rango de días hacia atrás para las fechas de aplicación (default 365)' })
  @ApiResponse({ status: 200, description: 'Datos simulados insertados exitosamente' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async seedVacunometro(@Query('registros') registros = 1000, @Query('dias') dias = 365) {
    const { insertados } = await this.seedService.seedVacunometro(+registros, +dias);
    return {
      message: `${insertados} registros simulados de vacunómetro insertados exitosamente`,
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

  @Delete('truncate-notificacion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Truncar TR_NOTIFICACION y todas sus tablas dependientes en cascada' })
  @ApiResponse({ status: 200, description: 'TR_NOTIFICACION truncada en cascada exitosamente' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async truncateNotificacion() {
    await this.seedService.truncateNotificacion();
    return {
      message: 'TR_NOTIFICACION truncada en cascada exitosamente',
      timestamp: new Date().toISOString(),
    };
  }
}
