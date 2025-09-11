import { Controller, Get, Logger, Query, UseFilters, Post, Body, Param } from '@nestjs/common';
import { ApiResponse, ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AefiQuery } from 'src/vigiflow-integrator/query/aefi-query';
import { HttpExceptionFilter } from '../../providers/http-exception.filter';
import { Dhis2IntegratorService } from '../services/dhis2-integrator.service';
import { Dhis2ProcessingLogService } from '../services/dhis2-processing-log.service';
import { Dhis2DuplicateHandlerService } from '../services/dhis2-duplicate-handler.service';
import { DuplicateConfirmationDto, DuplicateHandlingConfigDto } from '../dto/duplicate-handling.dto';

@ApiTags('Dhis2')
@Controller('integrator/dhis2')
@UseFilters(new HttpExceptionFilter())
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 403, description: 'Forbidden.' })
export class Dhis2IntegradorController {
  private readonly logger = new Logger(Dhis2IntegradorController.name);

  constructor(
    private readonly dhis2IntegratorService: Dhis2IntegratorService,
    private readonly processingLogService: Dhis2ProcessingLogService,
    private readonly duplicateHandlerService: Dhis2DuplicateHandlerService,
  ) {}

  @Get('/bulk')
  async console(@Query() aefiQuery: AefiQuery) {
    //  Asumiendo que aefiQuery.fechaInicio y aefiQuery.fechaFin son cadenas de texto en formato YYYYMMDD
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
    console.log(
      '***** fechaInicioDhis2:',
      aefiQuery.fechaInicio,
      fechaInicio,
      'fechaFin:',
      aefiQuery.fechaFin,
      fechaFin,
      'codigoATC:',
      aefiQuery.codigoATC,
    );

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
        msg: 'Error al importar datos del sistema DHIS2',
      };
    }
    return {
      status: 'OK',
      msg: 'Éxito',
    };
  }

  @Get('/bulk-with-duplicate-handling')
  @ApiOperation({ summary: 'Importación masiva con manejo de duplicados' })
  async createInBulkWithDuplicateHandling(
    @Query() aefiQuery: AefiQuery,
    @Body() duplicateConfig?: DuplicateHandlingConfigDto
  ) {
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
      await this.dhis2IntegratorService.createInBulk(
        fechaInicio,
        fechaFin,
        aefiQuery.codigoATC,
        duplicateConfig
      );
    } catch (error) {
      this.logger.error(error);
      return {
        status: 'ERROR',
        msg: 'Error al importar datos del sistema DHIS2',
      };
    }
    return {
      status: 'OK',
      msg: 'Éxito',
    };
  }

  @Get('/duplicates/pending')
  @ApiOperation({ summary: 'Obtener duplicados pendientes de confirmación' })
  async getPendingDuplicates() {
    return this.duplicateHandlerService.getPendingDuplicates();
  }

  @Get('/duplicates/pending/:codigoDhis2Evento')
  @ApiOperation({ summary: 'Obtener duplicado pendiente específico' })
  @ApiParam({ name: 'codigoDhis2Evento', description: 'Código del evento DHIS2' })
  async getPendingDuplicate(@Param('codigoDhis2Evento') codigoDhis2Evento: string) {
    return this.duplicateHandlerService.getPendingDuplicate(codigoDhis2Evento);
  }

  @Post('/duplicates/confirm')
  @ApiOperation({ summary: 'Confirmar acción para duplicado' })
  async confirmDuplicateAction(@Body() confirmation: DuplicateConfirmationDto) {
    try {
      // En un escenario real, necesitarías reconstruir el CreateCompleteDto
      // Por simplicidad, aquí se asume que ya está disponible
      const result = await this.duplicateHandlerService.processConfirmation(
        confirmation,
        null, // En implementación real, esto debería ser el DTO completo
        'MANUAL_CONFIRMATION'
      );
      return {
        status: 'OK',
        result
      };
    } catch (error) {
      this.logger.error(error);
      return {
        status: 'ERROR',
        msg: 'Error procesando confirmación de duplicado',
        error: error.message
      };
    }
  }

  @Get('/logs/:loteId')
  @ApiOperation({ summary: 'Obtener logs de procesamiento por lote' })
  @ApiParam({ name: 'loteId', description: 'ID del lote de procesamiento' })
  async getProcessingLogs(@Param('loteId') loteId: string) {
    return this.processingLogService.getLogsByLote(loteId);
  }

  @Get('/logs')
  @ApiOperation({ summary: 'Obtener todos los logs de procesamiento' })
  async getAllProcessingLogs() {
    return this.processingLogService.getAllLogs();
  }

  @Get('/summary/:loteId')
  @ApiOperation({ summary: 'Obtener resumen de procesamiento por lote' })
  @ApiParam({ name: 'loteId', description: 'ID del lote de procesamiento' })
  async getProcessingSummary(@Param('loteId') loteId: string) {
    return this.processingLogService.getProcessingSummary(loteId);
  }
}
