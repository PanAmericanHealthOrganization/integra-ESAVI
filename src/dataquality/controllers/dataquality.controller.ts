import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IController, Identificator, IGetManyParams } from 'src/utils/IController';
import { GetListParams } from 'src/utils/interfaces/pagination';
import { GeneralService } from '../services/general.service';
import { QualityDto } from './dto/quality.dto';

@Controller({ path: 'dataquality', version: '1' })
export class DataqualityController implements IController<QualityDto, QualityDto, QualityDto> {
  constructor(private readonly generalService: GeneralService) {}

  @Get('general')
  public async getGeneralQuality(@Query('date') dateString: Date): Promise<QualityDto> {
    // Si no se proporciona fecha, usar la fecha actual
    if (!dateString) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return await this.generalService.getGeneralQuality(today);
    }

    // Validar y parsear la fecha
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      throw new BadRequestException(
        `Fecha inválida: "${dateString}". Use formato ISO (YYYY-MM-DD) o timestamp válido.`,
      );
    }

    // Normalizar a medianoche para evitar problemas con horas
    date.setHours(0, 0, 0, 0);

    return await this.generalService.getGeneralQuality(date);
  }

  /**
   *
   * @param anio
   * @param mes
   * @param codigo
   * @returns
   */
  @Get('problems')
  public async qualityProblems(
    @Query('anio') anio: number,
    @Query('mes') mes: number,
    @Query('codigo') codigo: string,
  ): Promise<any[]> {
    return await this.generalService.qualityProblems(anio, mes, codigo);
  }

  /**
   *
   * @param body
   * @returns
   */
  @Post('history')
  public async getHistoryQuality(@Body() body: { startDay: Date; endDay: Date }): Promise<any[]> {
    const { startDay, endDay } = body;

    // Validar y parsear fechas
    if (!startDay || !endDay) {
      throw new BadRequestException('Se requieren las fechas startDay y endDay');
    }

    const parsedStartDay = new Date(startDay);
    const parsedEndDay = new Date(endDay);

    if (isNaN(parsedStartDay.getTime())) {
      throw new BadRequestException(`Fecha de inicio inválida: "${startDay}". Use formato ISO (YYYY-MM-DD)`);
    }

    if (isNaN(parsedEndDay.getTime())) {
      throw new BadRequestException(`Fecha de fin inválida: "${endDay}". Use formato ISO (YYYY-MM-DD)`);
    }

    if (parsedStartDay > parsedEndDay) {
      throw new BadRequestException('La fecha de inicio debe ser anterior o igual a la fecha de fin');
    }

    return await this.generalService.getHistoryQuality(parsedStartDay, parsedEndDay);
  }

  getMany(params: IGetManyParams): Promise<QualityDto[]> {
    throw new Error('Method not implemented.');
  }
  delete(id: Identificator, auditData: any): Promise<QualityDto> {
    throw new Error('Method not implemented.');
  }
  getOne(id: Identificator): Promise<QualityDto> {
    throw new Error('Method not implemented.');
  }
  getPaginated(params: GetListParams): Promise<{ data: QualityDto[]; total: number }> {
    throw new Error('Method not implemented.');
  }
  create(data: QualityDto): Promise<QualityDto> {
    throw new Error('Method not implemented.');
  }
  update(id: Identificator, data: QualityDto): Promise<QualityDto> {
    throw new Error('Method not implemented.');
  }
}
