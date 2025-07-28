import { Controller, Get, Query, Req, UseFilters } from '@nestjs/common';
import { ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../../providers/http-exception.filter';
import { ReporteService } from '../service/reporte.service';

@ApiTags('Reports')
@Controller('integrator/reports')
@ApiSecurity('X-API-KEY', ['X-API-KEY'])
// @UseGuards(AuthGuard('api-key'))  // Si des comento esta debo tener un token
@UseFilters(new HttpExceptionFilter())
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 403, description: 'Forbidden.' })
export class ReporteController {
  constructor(private reporteService: ReporteService) {}

  /**
   *
   * @param req
   * @returns
   */
  @Get('/createPdf')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  @ApiResponse({
    status: 400,
    description: 'The record has not been successfully retrieved.',
  })
  async createPdf(@Req() req) {
    const resp = await this.reporteService.createPdf();
    return {
      msg: 'OK',
      data: resp,
    };
  }

  /**
   *
   * @param req
   * @returns
   */
  @Get('/retrivePdf')
  // @ApiResponse({
  //   status: 200,
  //   description: 'The records have been successfully retrieved.',
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'The record has not been successfully retrieved.',
  // })
  async retrivePdf(@Query() aefiQuery: any, @Req() req) {
    const { startDate, endDate } = aefiQuery;

    if (!startDate || !endDate) {
      return {
        msg: 'Error',
        error: 'Both fechaInicio and fechaFin are required.',
      };
    }

    // Validar que las fechas tengan el formato correcto (YYYY-MM-DD)
    const isValidDateFormat = (date: string) =>
      /^\d{4}-\d{2}-\d{2}$/.test(date);

    if (!isValidDateFormat(startDate) || !isValidDateFormat(endDate)) {
      return {
        msg: 'Error',
        error: 'Invalid date format. Please use YYYY-MM-DD.',
      };
    }

    const fechaInicioDate = new Date(startDate);
    const fechaFinDate = new Date(endDate);

    // Verificar si las fechas son válidas
    if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinDate.getTime())) {
      return {
        msg: 'Error',
        error: 'Invalid date format. Please check your dates.',
      };
    }

    // Verificar que fechaInicio no sea mayor que fechaFin
    if (fechaInicioDate > fechaFinDate) {
      return {
        msg: 'Error',
        error: 'fechaInicio cannot be later than fechaFin.',
      };
    }

    const resp = await this.reporteService.retrivePdf(
      fechaInicioDate,
      fechaFinDate,
    );

    return {
      msg: 'OK',
      data: resp,
    };
  }

  /**
   *
   * @param req
   * @returns
   */
  @Get('/casosEsaviPorSexoGrave')
  // @ApiResponse({
  //   status: 200,
  //   description: 'The records have been successfully retrieved.',
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'The record has not been successfully retrieved.',
  // })
  async casosEsaviPorSexoGrave(@Req() req) {
    const resp = await this.reporteService.casosEsaviPorSexoGrave();
    return {
      msg: 'OK',
      data: resp,
    };
  }

  /**
   *
   * @param req
   * @returns
   */
  @Get('/casosEsaviPorSexoNoGrave')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  @ApiResponse({
    status: 400,
    description: 'The record has not been successfully retrieved.',
  })
  async casosEsaviPorSexoNoGrave(@Req() req) {
    const resp = await this.reporteService.casosEsaviPorSexoNoGrave();
    return {
      msg: 'OK',
      data: resp,
    };
  }

  /**
   *
   * @param req
   * @returns
   */
  @Get('/casosEsaviPorMes')
  @ApiResponse({
    status: 200,
    description: 'The records have been successfully retrieved.',
  })
  @ApiResponse({
    status: 400,
    description: 'The record has not been successfully retrieved.',
  })
  async casosEsaviPorMes(@Req() req) {
    const resp = await this.reporteService.casosEsaviPorMes();
    return {
      msg: 'OK',
      data: resp,
    };
  }

  /**
   *
   * @param req
   * @returns
   */
  @Get('/casosCruzadosMeddra')
  // @ApiResponse({
  //   status: 200,
  //   description: 'The records have been successfully retrieved.',
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'The record has not been successfully retrieved.',
  // })
  async casosCruzadosMeddra(@Req() req) {
    const resp = await this.reporteService.casosCruzadosMeddra();
    return {
      msg: 'OK',
      data: resp,
    };
  }

  /**
   *
   * @param req
   * @returns
   */
  @Get('/casosNoCruzadosMeddra')
  // @ApiResponse({
  //   status: 200,
  //   description: 'The records have been successfully retrieved.',
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'The record has not been successfully retrieved.',
  // })
  async casosNoCruzadosMeddra(@Req() req) {
    const resp = await this.reporteService.casosNoCruzadosMeddra();
    return {
      msg: 'OK',
      data: resp,
    };
  }

  /**
   *
   * @param req
   * @returns
   */
  @Get('/casosCruzadosWhodrug')
  // @ApiResponse({
  //   status: 200,
  //   description: 'The records have been successfully retrieved.',
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'The record has not been successfully retrieved.',
  // })
  async casosCruzadosWhodrug(@Req() req) {
    const resp = await this.reporteService.casosCruzadosWhodrug();
    return {
      msg: 'OK',
      data: resp,
    };
  }
}
