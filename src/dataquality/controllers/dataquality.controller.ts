import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { GeneralService } from '../services/general.service';
import { IController, Identificator, IGetManyParams } from 'src/utils/IController';
import { QualityDto } from './dto/quality.dto';
import { GetListParams } from 'src/utils/interfaces/pagination';

@Controller({ path: 'dataquality', version: '1' })
export class DataqualityController implements IController<QualityDto, QualityDto, QualityDto> {
  constructor(private readonly generalService: GeneralService) {}

  @Get('general')
  public async getGeneralQuality(@Query('date') dateString: string): Promise<QualityDto> {
    console.log('date', dateString);
    const date = new Date(dateString);
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
