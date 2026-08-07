import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { KeycloakAuthGuard } from '../../common/guards/keycloak-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DatamartService } from '../services/datamart.service';

/**
 * Endpoints del datamart DuckDB para el dashboard.
 *  - POST /v1/datamart/regenerar : fuerza la regeneración (on-demand).
 *  - GET  /v1/datamart/estado     : estado de la última generación.
 */
@ApiTags('datamart')
@Controller({ path: 'datamart', version: '1' })
export class DatamartController {
  constructor(private readonly datamart: DatamartService) {}

  @Post('regenerar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('keycloak-jwt')
  @ApiOperation({
    summary: 'Regenera el archivo DuckDB (esavi.duckdb) que consume el dashboard',
  })
  @ApiResponse({ status: 200, description: 'Resultado de la generación' })
  async regenerar() {
    const result = await this.datamart.regenerate('on-demand');
    return {
      message: result.ok
        ? 'Datamart regenerado correctamente'
        : 'La regeneración del datamart falló',
      ...result,
    };
  }

  @Get('estado')
  @ApiOperation({ summary: 'Estado de la última generación del datamart' })
  @ApiResponse({ status: 200, description: 'Estado actual' })
  estado() {
    return this.datamart.getStatus();
  }
}
