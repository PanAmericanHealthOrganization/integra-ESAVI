import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
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
