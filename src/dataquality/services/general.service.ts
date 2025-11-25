import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { IAuditoria } from 'src/integrator/entity';
import { DataSource, Equal, Repository } from 'typeorm';
import { QualityDto } from '../controllers/dto/quality.dto';
import { DataQualityDimensions } from '../entities/dataQualityDimensions.entity';
import { DimConsistenciaService } from './dim-consitencia';
import { DimExactitudService } from './dim-exactitud.service';

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
    private readonly dataQualityDimensionsRepository: Repository<DataQualityDimensions>,
    private readonly dimConsistenciaService: DimConsistenciaService,
    private readonly dimExactitudService: DimExactitudService,
    private readonly configService: ConfigService,
  ) {}

  async getGeneralQuality(date: Date): Promise<any> {
    let dataQualityDimension = await this.dataQualityDimensionsRepository.findOne({
      where: {
        fecha: Equal(date),
        dimension: Equal(this.schemaName),
      },
    });
    if (dataQualityDimension) {
      const t = JSON.parse(dataQualityDimension.jsonQuality);
      return { ...dataQualityDimension, jsonQuality: t };
    } else {
      await this.processQualityDay(date);
      dataQualityDimension = await this.dataQualityDimensionsRepository.findOne({
        where: {
          fecha: Equal(date),
          dimension: Equal(this.schemaName),
        },
      });
      const t = JSON.parse(dataQualityDimension.jsonQuality);
      return { ...dataQualityDimension, jsonQuality: t };
    }
  }

  async processQualityDay(day: Date): Promise<DataQualityDimensions> {
    // genera el resumen de calidad
    const g = await this.generateQualitySumary(day);

    //
    const auditoria: IAuditoria = {
      createdAt: new Date(),
      createdBy: this.configService.get('USUARIO_INSERTA_REGISTRO'),
      updatedAt: undefined,
      updatedBy: undefined,
      deletedAt: undefined,
      deletedBy: undefined,
      isEnabled: true,
      isActive: true,
    };
    let dataQualityDimension = await this.dataQualityDimensionsRepository.findOne({
      where: {
        fecha: Equal(day),
        dimension: Equal(this.schemaName),
      },
    });

    if (dataQualityDimension) {
      dataQualityDimension.jsonQuality = JSON.stringify(g.jsonQuality);
      dataQualityDimension.updatedAt = new Date();
      dataQualityDimension.updatedBy = this.configService.get('SYSTEUSUARIO_INSERTA_REGISTROM_USER');
      return this.dataQualityDimensionsRepository.save(dataQualityDimension);
    } else {
      // Si no existe, crear uno nuevo con la información de auditoría
      return this.dataQualityDimensionsRepository.save({
        fecha: day,
        dimension: this.schemaName,
        jsonQuality: JSON.stringify(g.jsonQuality),
        ...auditoria,
      });
    }
  }

  @Cron('0 0 3 * * *')
  async processQualityCron() {
    await this.processQualityDay(new Date());
  }

  async generateQualitySumary(day: Date): Promise<QualityDto> {
    const [dimExactitud, dimConsistencia] = await Promise.all([
      this.dimExactitudService.processAll(day),
      this.dimConsistenciaService.processAll(day),
    ]);

    return {
      fecha: day,
      jsonQuality: [dimExactitud, dimConsistencia],
    };
  }
}
