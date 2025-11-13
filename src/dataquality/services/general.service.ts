import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityDto } from '../controllers/dto/quality.dto';
import { DataqualityDimensions } from '../entities/dataquality.entity';
import { CompletenessService } from './complees.service';
/**
 *
 */
@Injectable()
export class GeneralService {
  constructor(
    @InjectRepository(DataqualityDimensions, 'DATAQUALITY_DS')
    private dataqualityDimensionsRepository: Repository<DataqualityDimensions>,
    private completenessService: CompletenessService,
  ) {}
  async processQuality() {
    const g = await this.generalQuality();
    await this.dataqualityDimensionsRepository.save({
      fecha: g.fecha,
      dimension: g.dimension,
      jsonQuality: JSON.stringify(g.jsonQuality),
    });
  }

  async generalQuality(): Promise<QualityDto> {
    return {
      fecha: new Date(),
      dimension: '',
      jsonQuality: {
        totalRegistros: 0,
        totalErrores: 0,
        totalPorcentaje: 0,
        completenessQualityTable: await this.completenessService.obtenerCompletitudDeEsquema(
          'dhi_esavi',
        ),
        sintacticQuality: [],
        semanticQuality: [],
        temporalQuality: [],
      },
    };
  }
}
