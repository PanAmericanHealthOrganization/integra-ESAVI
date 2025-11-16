import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { QualityDto } from '../controllers/dto/quality.dto';
import { DataQualityDimensions } from '../entities/dataQualityDimensions.entity';
import { CompletenessService } from './complees.service';
import { SemanticService } from './semantic.service';
import { SintacticService } from './sintactic.service';
/**
 *
 */
@Injectable()
export class GeneralService {
  private readonly schemaName = 'dhi_esavi';

  constructor(
    @InjectDataSource('DATAQUALITY_DS')
    private readonly dataSource: DataSource,
    @InjectRepository(DataQualityDimensions, 'DATAQUALITY_DS')
    private dataQualityDimensionsRepository: Repository<DataQualityDimensions>,
    private completenessService: CompletenessService,
    private sintacticService: SintacticService,
    private semanticService: SemanticService,
  ) {}

  async getGeneralQuality(date: Date): Promise<QualityDto> {
    const dataQualityDimension = await this.dataQualityDimensionsRepository.findOne({
      where: {
        fecha: date,
        dimension: this.schemaName,
      },
    });
    if (dataQualityDimension) {
      return JSON.parse(dataQualityDimension.jsonQuality);
    }
    return await this.processQualityDay(date);
  }

  private async processQualityDay(day: Date): Promise<QualityDto> {
    const g = await this.generalQuality(day);
    await this.dataQualityDimensionsRepository.save({
      fecha: g.fecha,
      dimension: g.dimension,
      jsonQuality: JSON.stringify(g.jsonQuality),
    });
    return g;
  }

  @Cron('0 0 3 * * *')
  async processQualityCron() {
    await this.processQualityDay(new Date());
  }

  async generalQuality(day: Date): Promise<QualityDto> {
    const [completenessQualityTable, sintacticQuality, semanticQuality] = await Promise.all([
      this.completenessService.obtenerCompletitudDeEsquema(this.schemaName),
      this.sintacticService.sintacticQuality(),
      this.semanticService.semanticQuality(),
    ]);

    return {
      fecha: day,
      dimension: this.schemaName,
      jsonQuality: {
        totalRegistros: (await this.calculateTotalRecords('TR_NOTIFICACION')) ?? 0,
        totalErrores: -100,
        totalPorcentaje: -100,
        completenessQualityTable,
        sintacticQuality,
        semanticQuality,
        temporalQuality: [],
      },
    };
  }

  private async calculateTotalRecords(tableName: string): Promise<number> {
    const query = `
      SELECT COUNT(*)::BIGINT AS total
      FROM dhi_esavi."${tableName}";
    `;

    const [result] = await this.dataSource.query(query);
    return Number(result?.[0]?.total ?? 0);
  }
}
