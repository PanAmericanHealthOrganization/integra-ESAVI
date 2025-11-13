import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CompletenessQualityTableDto,
  QualityDto,
  SemanticQualityTableDto,
  SintacticQualityDto,
} from '../controllers/dto/quality.dto';
import { DataqualityDimensions } from '../entities/dataquality.entity';
import { CompletenessService } from './complees.service';
import { SintacticService } from './sintactic.service';
import { SemanticService } from './semantic.service';
/**
 *
 */
@Injectable()
export class GeneralService {
  private readonly schemaName = 'dhi_esavi';

  constructor(
    @InjectRepository(DataqualityDimensions, 'DATAQUALITY_DS')
    private dataqualityDimensionsRepository: Repository<DataqualityDimensions>,
    private completenessService: CompletenessService,
    private sintacticService: SintacticService,
    private semanticService: SemanticService,
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
    const [completenessQualityTable, sintacticQuality, semanticQuality] = await Promise.all([
      this.completenessService.obtenerCompletitudDeEsquema(this.schemaName),
      this.sintacticService.sintacticQuality(),
      this.semanticService.semanticQuality(),
    ]);

    return {
      fecha: new Date(),
      dimension: this.schemaName,
      jsonQuality: {
        totalRegistros: this.calculateTotalRecords(completenessQualityTable),
        totalErrores: 0,
        totalPorcentaje: 0,
        completenessQualityTable,
        sintacticQuality,
        semanticQuality,
        temporalQuality: [],
      },
    };
  }

  private calculateTotalRecords(tables: CompletenessQualityTableDto[]): number {
    const totalsByTable = new Map<string, number>();
    tables.forEach((item) => {
      if (!totalsByTable.has(item.tableName)) {
        totalsByTable.set(item.tableName, item.totalRecords);
      }
    });
    return Array.from(totalsByTable.values()).reduce((acc, current) => acc + current, 0);
  }
}
