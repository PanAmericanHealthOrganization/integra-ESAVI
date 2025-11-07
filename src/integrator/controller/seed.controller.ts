import { Controller, Post, HttpCode, HttpStatus, Delete } from '@nestjs/common';
import { SeedService } from '../service/seed.service';
import { ApiTags } from '@nestjs/swagger';

/**
 *
 */
@ApiTags('Seed')
@Controller({ path: 'seed', version: '1' })
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async seedData() {
    await this.seedService.seedData();
    return {
      message: 'Controlador del semillero: Valores cargados exitosamente en el catálogo de homologación.',
      timestamp: new Date().toISOString(),
    };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async cleanData() {
    await this.seedService.cleanData();
    return {
      message: 'Datos limpiados exitosamente',
      timestamp: new Date().toISOString(),
    };
  }
}
