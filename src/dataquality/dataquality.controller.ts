import { Controller, Get, Param, InternalServerErrorException, Query } from '@nestjs/common';
import { DataqualityService } from './dataquality.service';

@Controller({ path: 'dataquality', version: '1' })
export class DataqualityController {
  constructor(private readonly dataqualityService: DataqualityService) {}

  @Get('completeness/:tableName')
  async getTableCompleteness(@Param('tableName') tableName: string) {
    try {
      const completenessData = await this.dataqualityService.getTableCompleteness(tableName);
      return { tableName, completenessData };
    } catch (error) {
      console.error('Error en el controlador de calidad de datos:', error.message);
      throw new InternalServerErrorException('Error al obtener la completitud de la tabla.');
    }
  }

  @Get('tables')
  async getAllTables() {
    try {
      const tables = await this.dataqualityService.getAllTables();
      return { tables };
    } catch (error) {
      console.error(
        'Error en el controlador de calidad de datos al obtener tablas:',
        error.message,
      );
      throw new InternalServerErrorException('Error al obtener las tablas de la base de datos.');
    }
  }

  @Get('stored-completeness')
  async getStoredTableCompleteness(@Query('tableName') tableName?: string) {
    try {
      const storedData = await this.dataqualityService.getStoredTableCompleteness(tableName);
      return { storedData };
    } catch (error) {
      console.error(
        'Error en el controlador de calidad de datos al obtener registros almacenados:',
        error.message,
      );
      throw new InternalServerErrorException(
        'Error al obtener los registros de completitud almacenados.',
      );
    }
  }
}
