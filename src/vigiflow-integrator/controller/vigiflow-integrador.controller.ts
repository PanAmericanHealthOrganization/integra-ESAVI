import {
  Controller,
  Get,
  Logger,
  Query,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { HttpExceptionFilter } from '../../providers/http-exception.filter';
import { VigiflowCrawlerService } from '../service/vigiflow-crawler.service';
import { VigiflowIntegradorService } from '../service/vigiflow-integrador.service';
import { Response } from 'express';
import { AefiQuery } from '../query/aefi-query';
import { MaholderService } from 'src/whodrugs/services/maholder.service';

@ApiTags('Vigiflow')
@Controller('integrator/vigiflow')
@ApiSecurity('X-API-KEY', ['X-API-KEY'])
@UseGuards(AuthGuard('api-key'))
@UseFilters(new HttpExceptionFilter())
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 403, description: 'Forbidden.' })
export class VigiflowIntegradorController {
  private readonly logger = new Logger(VigiflowIntegradorController.name);
  constructor(
    private readonly vigiflowCrawlerService: VigiflowCrawlerService,
    private readonly vigiflowIntegradorService: VigiflowIntegradorService,
    private readonly maholderService: MaholderService
  ) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/retrieveJWT')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  async retrieveJwt(@Req() req) {
    return await this.vigiflowCrawlerService.retrieveJWT();
  }

  @Get('/download')
  async downloadExcelFile(@Res() res: Response, @Query() query: AefiQuery) {
     const excelBuffer = await this.vigiflowCrawlerService.retrieveExcelReport(
       query.fechaInicio,
       query.fechaFin,
       query.codigoATC,
     );
     res.set({
       'Content-Type':
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       'Content-Disposition': 'attachment; filename=myfile.xlsx',
     });
     res.send(excelBuffer);
  }

  @Get('/bulk')
  async bulk(@Query() aefiQuery: AefiQuery) {
    // const fechaInicio: Date = new Date(aefiQuery.fechaInicio);
    // const fechaFin: Date = new Date(aefiQuery.fechaFin);

     // Asumiendo que aefiQuery.fechaInicio y aefiQuery.fechaFin son cadenas de texto en formato YYYYMMDD
     const fechaInicio: Date = new Date(`${aefiQuery.fechaInicio.slice(0, 4)}-${aefiQuery.fechaInicio.slice(4, 6)}-${aefiQuery.fechaInicio.slice(6)}`);
     const fechaFin: Date = new Date(`${aefiQuery.fechaFin.slice(0, 4)}-${aefiQuery.fechaFin.slice(4, 6)}-${aefiQuery.fechaFin.slice(6)}`);
     console.log('***** fechaInicio:', aefiQuery.fechaInicio, fechaInicio, 'fechaFin:', aefiQuery.fechaFin, fechaFin, 'codigoATC:', aefiQuery.codigoATC )
    
    try {
      await this.vigiflowIntegradorService.createInBulk(
        fechaInicio,
        fechaFin,
        aefiQuery.codigoATC,
      );
    } catch (error) {
      this.logger.error(error);
      return {
        status: 'ERROR',
        msg: 'Error al importar datos del sistema Vigiflow'
      }
    }
    return {
      status: 'OK',
      msg: 'Éxito'
    }
  }
}
