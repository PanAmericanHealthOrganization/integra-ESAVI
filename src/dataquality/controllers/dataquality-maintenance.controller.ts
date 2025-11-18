import { Controller, Delete, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataqualityMaintenanceService } from '../services/maintenance.service';

@ApiTags('dataquality-maintenance')
@Controller({ path: 'dataquality/maintenance', version: '1' })
export class DataqualityMaintenanceController {
  constructor(private readonly maintenanceService: DataqualityMaintenanceService) {}

  @Delete('evaluations')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Elimina todas las evaluaciones de calidad almacenadas',
  })
  async deleteAllEvaluations() {
    const result = await this.maintenanceService.deleteAllEvaluations();
    return {
      message: 'Evaluaciones de calidad eliminadas correctamente',
      ...result,
    };
  }

  @Post('evaluations/last-month')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiResponse({
    status: 202,
    description: 'Inicia la evaluación de la calidad para todos los días del último mes',
  })
  async evaluateLastMonth() {
    const result = await this.maintenanceService.evaluateLastMonth();
    return {
      message: 'Evaluación del último mes procesada',
      ...result,
    };
  }
}

