import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TemporalQualityTableDto } from '../controllers/dto/quality.dto';

@Injectable()
export class TemporalQualityService {
  constructor(
    @InjectDataSource('DATAQUALITY_DS')
    private readonly dataSource: DataSource,
  ) {}

  async temporalQuality(day: Date): Promise<TemporalQualityTableDto[]> {
    return Promise.all([this.validateNotificationDate(day)]);
  }

  private async validateNotificationDate(day: Date): Promise<TemporalQualityTableDto> {
    const total = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS total
      FROM dhi_esavi."TR_NOTIFICACION" n
      WHERE n."FECHA_NOTIFICACION" IS NOT NULL
        AND n."AUD_FECHA_CREACION" <= $1;
    `,
      'total',
      day,
    );

    const invalid = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS invalid
      FROM dhi_esavi."TR_NOTIFICACION" n
      WHERE n."FECHA_NOTIFICACION" IS NOT NULL
        AND n."FECHA_NOTIFICACION" < n."AUD_FECHA_CREACION"
        AND n."AUD_FECHA_CREACION" <= $1;
    `,
      'invalid',
      day,
    );

    const valid = Math.max(total - invalid, 0);

    return this.toTemporalDto({
      ruleCode: 'fechaNotificacionNoAnteriorAFechaCreacion',
      ruleName: 'fechaNotificacionNoAnteriorAFechaCreacion',
      ruleDescription: 'La fecha de notificación no debe ser anterior a la fecha de creación',
      totalRecords: total,
      valid,
      invalid,
    });
  }

  private async fetchCount(query: string, alias: string, day: Date): Promise<number> {
    const [result] = await this.dataSource.query(query, [day]);
    return Number(result?.[alias] ?? 0);
  }

  private toTemporalDto({
    ruleCode,
    ruleName,
    ruleDescription,
    totalRecords,
    valid,
    invalid,
  }: {
    ruleCode: string;
    ruleName: string;
    ruleDescription: string;
    totalRecords: number;
    valid: number;
    invalid: number;
  }): TemporalQualityTableDto {
    const percentageValidRecords =
      totalRecords === 0 ? 0 : Number(((valid / totalRecords) * 100).toFixed(2));
    const percentageInvalidRecords =
      totalRecords === 0 ? 0 : Number(((invalid / totalRecords) * 100).toFixed(2));
    return {
      ruleCode,
      ruleName,
      ruleDescription,
      totalRecords,
      totalRegistrosValidos: valid,
      totalRegistrosInvalidos: invalid,
      porcentajeRegistrosValidos: percentageValidRecords,
      porcentajeRegistrosInvalidos: percentageInvalidRecords,
    };
  }
}
