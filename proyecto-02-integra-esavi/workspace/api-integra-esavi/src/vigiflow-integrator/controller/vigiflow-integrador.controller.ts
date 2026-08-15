import {Controller,Get,Logger,Query,Res,UseFilters,UseGuards} from '@nestjs/common';
import {ApiBearerAuth,ApiResponse,ApiTags} from '@nestjs/swagger';
import {Response} from 'express';
import {MaholderService} from 'src/whodrugs/services/maholder.service';
import * as xlsx from 'xlsx';
import {Usuario,UsuarioAutenticado} from '../../common/decorators/usuario.decorator';
import {KeycloakAuthGuard} from '../../common/guards/keycloak-auth.guard';
import {HttpExceptionFilter} from '../../providers/http-exception.filter';
import {AefiQuery} from '../dto';
import {VigiflowCrawlerService} from '../service/vigiflow-crawler.service';
import {VigiflowIntegradorService} from '../service/vigiflow-integrador.service';

@ApiTags('Vigiflow')
@Controller('integrator/vigiflow')
@UseFilters(new HttpExceptionFilter())
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 403, description: 'Forbidden.' })
export class VigiflowIntegradorController {
  private readonly logger = new Logger(VigiflowIntegradorController.name);
  constructor(
    private readonly vigiflowCrawlerService: VigiflowCrawlerService,
    private readonly vigiflowIntegradorService: VigiflowIntegradorService,
    private readonly maholderService: MaholderService,
  ) {}

  /************CRUD PARA MICROSERVICIOS************/
  //BUSCAR TODOS LOS ITEMS
  @Get('/retrieveJWT')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  async retrieveJwt() {
    return await this.vigiflowCrawlerService.retrieveJWT();
  }

  @Get('/download')
  async downloadExcelFile(@Res() res: Response, @Query() query: AefiQuery) {
    const workbook = await this.vigiflowCrawlerService.retrieveExcelReport(
      query.fechaInicio,
      query.fechaFin,
      query.codigoATC,
    );
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=myfile.xlsx',
    });
    res.send(excelBuffer);
  }

  /**
   * Lanza la importación de un rango de fechas.
   *
   * Va detrás del guard de Keycloak porque el desenlace se avisa al usuario que la lanzó:
   * sin token no hay `sub` con el que identificar su buzón. La corrida en TR_SYNC_PROCESS
   * se registra igual con token o sin él (el cron no lo tiene), pero la notificación sólo
   * puede salir si se sabe a quién dirigirla.
   */
  @Get('/bulk')
  @UseGuards(KeycloakAuthGuard)
  @ApiBearerAuth('keycloak-jwt')
  async bulk(@Query() aefiQuery: AefiQuery, @Usuario() usuario: UsuarioAutenticado) {
    // const fechaInicio: Date = new Date(aefiQuery.fechaInicio);
    // const fechaFin: Date = new Date(aefiQuery.fechaFin);

    // Asumiendo que aefiQuery.fechaInicio y aefiQuery.fechaFin son cadenas de texto en formato YYYYMMDD
    const fechaInicio: Date = new Date(
      `${aefiQuery.fechaInicio.slice(0, 4)}-${aefiQuery.fechaInicio.slice(
        4,
        6,
      )}-${aefiQuery.fechaInicio.slice(6)}`,
    );
    const fechaFin: Date = new Date(
      `${aefiQuery.fechaFin.slice(0, 4)}-${aefiQuery.fechaFin.slice(
        4,
        6,
      )}-${aefiQuery.fechaFin.slice(6)}`,
    );
    try {
      const resumen = await this.vigiflowIntegradorService.createInBulk(
        fechaInicio,
        fechaFin,
        aefiQuery.codigoATC,
        usuario,
      );

      // Un rango de más de un mes se procesa mes a mes; el detalle importa porque algunos
      // periodos pueden haber fallado mientras el resto se importó correctamente.
      const detallePeriodos =
        resumen.totalPeriodos > 1 ? ` (${resumen.completados} de ${resumen.totalPeriodos} periodos mensuales)` : '';

      if (resumen.fallidos.length > 0) {
        return {
          status: 'PARTIAL',
          msg: `Importación parcial${detallePeriodos}. Periodos con error: ${resumen.fallidos
            .map((f) => f.periodo)
            .join(', ')}`,
        };
      }

      return {
        status: 'OK',
        msg: `Datos importados exitosamente desde Vigiflow${detallePeriodos}`,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 'ERROR',
        msg: 'Error al importar datos del sistema Vigiflow',
      };
    }
  }

  /**
   *
   */
  @Get('/bulk-from-file')
  @UseGuards(KeycloakAuthGuard)
  @ApiBearerAuth('keycloak-jwt')
  async bulkFromFile(@Usuario() usuario: UsuarioAutenticado): Promise<{ status: string; msg: string }> {
    try {
      await this.vigiflowIntegradorService.createInBulkFromFile(usuario);
      return {
        status: 'OK',
        msg: 'Datos importados exitosamente desde archivo',
      };
    } catch (error) {
      this.logger.error('Error en bulk-from-file:', error);
      return {
        status: 'ERROR',
        msg: 'Error al importar datos desde archivo',
      };
    }
  }
}
