import { Controller, Get, Logger, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { HttpExceptionFilter } from '../../providers/http-exception.filter';
import { Dhis2IntegratorService } from '../services/dhis2-integrator.service';
import { AefiQuery } from 'src/vigiflow-integrator/query/aefi-query';

@ApiTags('Dhis2')
@Controller('integrator/dhis2')
@ApiSecurity('X-API-KEY', ['X-API-KEY'])
@UseGuards(AuthGuard('api-key'))
@UseFilters(new HttpExceptionFilter())
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 403, description: 'Forbidden.' })
export class Dhis2IntegradorController {
  private readonly logger = new Logger(Dhis2IntegradorController.name);

  constructor(
    private readonly dhis2IntegratorService: Dhis2IntegratorService,
  ) { }

  @Get('/bulk')
  async console(@Query() aefiQuery: AefiQuery) {
      //  Asumiendo que aefiQuery.fechaInicio y aefiQuery.fechaFin son cadenas de texto en formato YYYYMMDD
       const fechaInicio: Date = new Date(`${aefiQuery.fechaInicio.slice(0, 4)}-${aefiQuery.fechaInicio.slice(4, 6)}-${aefiQuery.fechaInicio.slice(6)}`);
       const fechaFin: Date = new Date(`${aefiQuery.fechaFin.slice(0, 4)}-${aefiQuery.fechaFin.slice(4, 6)}-${aefiQuery.fechaFin.slice(6)}`);
       console.log('***** fechaInicioDhis2:', aefiQuery.fechaInicio, fechaInicio, 'fechaFin:', aefiQuery.fechaFin, fechaFin, 'codigoATC:', aefiQuery.codigoATC )
      
    try {
      await this.dhis2IntegratorService.createInBulk(
        fechaInicio,
        fechaFin,
        aefiQuery.codigoATC,
      );
    } catch (error) {
      this.logger.error(error);
      return {
        status: 'ERROR',
        msg: 'Error al importar datos del sistema DHIS2'
      }
    }
    return {
      status: 'OK',
      msg: 'Éxito'
    }
  }
}
