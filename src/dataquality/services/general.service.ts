import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Equal, Repository } from 'typeorm';
import { QualityDto } from '../controllers/dto/quality.dto';
import { DataQualityDimensions } from '../entities/dataQualityDimensions.entity';
import { CompletenessService } from './complees.service';
import { SemanticService } from './semantic.service';
import { SintacticService } from './sintactic.service';
import { IAuditoria } from 'src/integrator/entity';

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
        fecha: Equal(date),
        dimension: Equal(this.schemaName),
      },
    });
    if (dataQualityDimension) {
      return JSON.parse(dataQualityDimension.jsonQuality);
    }
    const result = await this.processQualityDay(date);
    return JSON.parse(result.jsonQuality);
  }

  private async processQualityDay(day: Date): Promise<DataQualityDimensions> {
    const g = await this.generalQuality(day);
    const auditoria: IAuditoria = {
      createdAt: new Date(),
      createdBy: 'System',
      updatedAt: undefined,
      updatedBy: 'System',
      deletedAt: undefined,
      deletedBy: 'System',
      isEnabled: true,
      isActive: true,
    };
    let dataQualityDimension = await this.dataQualityDimensionsRepository.findOne({
      where: {
        fecha: Equal(day),
        dimension: Equal(g.dimension),
      },
    });

    if (dataQualityDimension) {
      dataQualityDimension.jsonQuality = JSON.stringify(g.jsonQuality);
      dataQualityDimension.updatedAt = new Date();
      dataQualityDimension.updatedBy = 'System';
      return this.dataQualityDimensionsRepository.save(dataQualityDimension);
    } else {
      // Si no existe, crear uno nuevo con la información de auditoría
      return this.dataQualityDimensionsRepository.save({
        fecha: day,
        dimension: g.dimension,
        jsonQuality: JSON.stringify(g.jsonQuality),
        createdAt: new Date(),
        createdBy: 'System',
        updatedAt: undefined,
        updatedBy: undefined,
        deletedAt: undefined,
        deletedBy: undefined,
        isEnabled: true,
        isActive: true,
      });
    }
  }

  @Cron('0 0 3 * * *')
  async processQualityCron() {
    await this.processQualityDay(new Date());
  }

  async generalQuality(day: Date): Promise<QualityDto> {
    const [completenessQualityTable, sintacticQuality, semanticQuality] = await Promise.all([
      this.completenessService.obtenerCompletitudDeEsquema(this.schemaName, day),
      this.sintacticService.sintacticQuality(day),
      this.semanticService.semanticQuality(day),
    ]);

    return {
      fecha: day,
      dimension: this.schemaName,
      jsonQuality: {
        totalRegistros: (await this.calculateTotalRecords('TR_NOTIFICACION', day)) ?? 0,
        totalErrores: -100,
        totalPorcentaje: -100,
        completenessQualityTable,
        sintacticQuality,
        semanticQuality,
        temporalQuality: [],
      },
    };
  }

  private async calculateTotalRecords(tableName: string, day: Date): Promise<number> {
    const query = `
      SELECT COUNT(*)::BIGINT AS total
      FROM "dhi_esavi"."${tableName}" t where t."AUD_FECHA_CREACION" <= $1;
    `;

    const [result] = await this.dataSource.query(query, [day]);
    return Number(result?.total ?? 0);
  }
}
