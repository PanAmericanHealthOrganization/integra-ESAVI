import { Controller, Post, HttpCode, HttpStatus, Delete } from '@nestjs/common';
import { SeedService } from '../service/seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async seedData() {
    await this.seedService.seedData();
    return {
      message: 'Datos de ejemplo cargados exitosamente',
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
