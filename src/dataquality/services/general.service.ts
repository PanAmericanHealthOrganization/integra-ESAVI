import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { getMonth, getYear } from 'date-fns';
import { IAuditoria } from 'src/integrator/entity';
import { Between, DataSource, Equal, Repository } from 'typeorm';
import { HistoryQualityDto } from '../controllers/dto/historyQuality.dto';
import { DimensionCalidadDatosDto, IDataQualityDimensions, QualityDto } from '../controllers/dto/quality.dto';
import { DataQualityDimensions } from '../entities/dataQualityDimensions.entity';
import { convertirAHistoryQualityDto } from '../utils/dataQualityUtils';
import { DimCompletitudService } from './dim-completitud';
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
    private readonly dimCompletitudService: DimCompletitudService,
  ) {}

  /**
   *
   * @param date
   * @returns
   */
  async getGeneralQuality(date: Date): Promise<any> {
    const [year, month] = [getYear(date), getMonth(date) + 1];
    let dataQualityDimension = await this.dataQualityDimensionsRepository.findOne({
      where: {
        anio: year,
        mes: month,
      },
    });

    if (!dataQualityDimension) {
      await this.processQualityDay(date);
      dataQualityDimension = await this.dataQualityDimensionsRepository.findOne({
        where: {
          anio: year,
          mes: month,
        },
      });
    }

    return {
      ...dataQualityDimension,
      jsonQuality: JSON.parse(dataQualityDimension.jsonQuality),
    };
  }

  async processQualityDay(day: Date): Promise<DataQualityDimensions> {
    console.log('Procesando calidad de datos para el día:', day);
    // genera el resumen de calidad
    const g = await this.generateQualitySumary(day);
    const [year, month] = [getYear(day), getMonth(day) + 1];

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
        anio: Equal(year),
        mes: Equal(month),
      },
    });

    if (dataQualityDimension) {
      dataQualityDimension.jsonQuality = JSON.stringify(g.jsonQuality);
      dataQualityDimension.updatedAt = new Date();
      dataQualityDimension.updatedBy = this.configService.get('SYSTEUSUARIO_INSERTA_REGISTROM_USER');
      return this.dataQualityDimensionsRepository.save<IDataQualityDimensions>(dataQualityDimension);
    } else {
      // Si no existe, crear uno nuevo con la información de auditoría
      return this.dataQualityDimensionsRepository.save<IDataQualityDimensions>({
        anio: year,
        mes: month,
        jsonQuality: JSON.stringify(g.jsonQuality),
        ...auditoria,
      });
    }
  }

  /**
   * Cron job to process data quality every day at 3 AM
   */
  @Cron('0 0 3 1 * *')
  async processQualityCron() {
    await this.processQualityDay(new Date());
  }

  /**
   *
   * @param day
   * @returns
   */
  async generateQualitySumary(day: Date): Promise<QualityDto> {
    const [dimExactitud, dimConsistencia, dimCompletitud] = await Promise.all([
      this.dimExactitudService.processAll(day),
      this.dimConsistenciaService.processAll(day),
      this.dimCompletitudService.processAll(day),
    ]);

    return {
      anio: getYear(day),
      mes: getMonth(day) + 1,
      jsonQuality: [dimExactitud, dimConsistencia, dimCompletitud],
    };
  }

  /**
   *
   * @param anio
   * @param mes
   * @param codigoRegla
   * @returns
   */
  async qualityProblems(anio: number, mes: number, codigoRegla: string): Promise<any> {
    const t = await this.dataQualityDimensionsRepository
      .createQueryBuilder('dimension_quality')
      .where('dimension_quality.anio = :anio AND dimension_quality.mes = :mes', { anio, mes })
      .getOne();

    const jsonQuality = JSON.parse(t.jsonQuality) as DimensionCalidadDatosDto[];
    const filteredJsonQuality = jsonQuality
      .map((dim) => dim.jsonDimensionQuality.filter((r) => r.codigo === codigoRegla))
      .flat()
      .find((r) => r);

    const ids = filteredJsonQuality.idNotificacionesNoValidos;
    const q = `
      SELECT
      tn."ID",
      tn."FECHA_NOTIFICACION",
      CASE
        WHEN tn."CODIGO_DHIS2_EVENTO" IS NOT NULL THEN 'DHIS2'
        ELSE 'VIGIFLOW'
      END AS "origen",
      tp."NOMBRE",
      tp."IDENTIFICACION"
      FROM
      dhi_esavi."TR_NOTIFICACION" tn
      INNER JOIN 
      dhi_esavi."TR_PACIENTE" tp 
      ON
      tp."ID" = tn."PACIENTE_ID"
      WHERE
      tn."ID" IN (${ids.map((id) => `'${id}'`).join(', ')})
    `;
    const result = await this.dataSource.query(q);
    // elminar duplicados
    const uniqueResults = Array.from(new Map(result.map((item) => [item.ID, item])).values());
    return uniqueResults;
  }

  public async getHistoryQuality(startDate: Date, endDate: Date): Promise<HistoryQualityDto[]> {
    // Validar que las fechas sean válidas
    if (!startDate || !endDate || isNaN(new Date(startDate).getTime()) || isNaN(new Date(endDate).getTime())) {
      throw new Error('Fechas inválidas proporcionadas');
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    const startYear = getYear(parsedStartDate);
    const startMonth = getMonth(parsedStartDate) + 1;
    const endYear = getYear(parsedEndDate);
    const endMonth = getMonth(parsedEndDate) + 1;

    // Validar que los valores no sean NaN
    if (isNaN(startYear) || isNaN(startMonth) || isNaN(endYear) || isNaN(endMonth)) {
      throw new Error('Error al procesar las fechas');
    }

    const records = await this.dataQualityDimensionsRepository.find({
      where: {
        anio: Between(startYear, endYear),
      },
      order: {
        anio: 'ASC',
        mes: 'ASC',
      },
    });

    const t = records.filter((record) => {
      if (record.anio === startYear && record.anio === endYear) {
        return record.mes >= startMonth && record.mes <= endMonth;
      }
      if (record.anio === startYear) {
        return record.mes >= startMonth;
      }
      if (record.anio === endYear) {
        return record.mes <= endMonth;
      }
      return true;
    });
    return convertirAHistoryQualityDto(t);
  }
}
