import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SemanticQualityTableDto } from '../controllers/dto/quality.dto';

@Injectable()
export class SemanticService {
  constructor(
    @InjectDataSource('DATAQUALITY_DS')
    private readonly dataSource: DataSource,
  ) {}

  async semanticQuality(day: Date): Promise<SemanticQualityTableDto[]> {
    return Promise.all([
      this.validateMinAge(day),
      this.validateMaxAge(day),
      this.validateBirthDateNotAfterNotification(day),
      this.validateReferentialIntegrity(day),
    ]);
  }

  private async validateMinAge(day: Date): Promise<SemanticQualityTableDto> {
    const total = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS total
      FROM dhi_esavi."TR_NOTIFICACION" n
      WHERE n."AUD_FECHA_CREACION" < $1;
    `,
      'total',
      day,
    );

    const invalid = await this.fetchCount(
      ` 
      SELECT COUNT(*)::BIGINT AS invalid
      FROM dhi_esavi."TR_NOTIFICACION" n
      WHERE n."EDAD" IS NULL OR n."EDAD" < 0 AND n."AUD_FECHA_CREACION" < $1;
    `,
      'invalid',
      day,
    );

    const valid = Math.max(total - invalid, 0);

    return this.toSemanticDto({
      ruleCode: 'edadNoNegativa',
      ruleName: 'edadNoNegativa',
      ruleDescription: `La edad registrada en dhi_esavi."TR_NOTIFICACION".EDAD no debe ser negativa`,
      totalRecords: total,
      valid,
      invalid,
    });
  }

  private async validateMaxAge(day: Date): Promise<SemanticQualityTableDto> {
    const total = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS total
      FROM dhi_esavi."TR_NOTIFICACION" n
      WHERE n."AUD_FECHA_CREACION" < $1;
    `,
      'total',
      day,
    );

    const invalid = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS invalid
      FROM dhi_esavi."TR_NOTIFICACION" n
      WHERE n."EDAD" IS NULL OR n."EDAD" > 100 AND n."AUD_FECHA_CREACION" < $1;
    `,
      'invalid',
      day,
    );

    const valid = Math.max(total - invalid, 0);

    return this.toSemanticDto({
      ruleCode: 'edadNoMayorA100',
      ruleName: 'edadNoMayorA100',
      ruleDescription: `La edad registrada en dhi_esavi."TR_NOTIFICACION".EDAD no debe superar los 100 años`,
      totalRecords: total,
      valid,
      invalid,
    });
  }

  private async validateBirthDateNotAfterNotification(day: Date): Promise<SemanticQualityTableDto> {
    const total = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS total
      FROM dhi_esavi."TR_NOTIFICACION" n inner join dhi_esavi."TR_PACIENTE" p on n."PACIENTE_ID" = p."PACIENTE_ID"
      WHERE p."FECHA_NACIMIENTO" > n."FECHA_NOTIFICACION" AND n."AUD_FECHA_CREACION" < $1;
    `,
      'total',
      day,
    );

    const invalid = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS invalid
      FROM dhi_esavi."TR_NOTIFICACION" n inner join dhi_esavi."TR_PACIENTE" p on n."PACIENTE_ID" = p."PACIENTE_ID"
      WHERE p."FECHA_NACIMIENTO" < n."FECHA_NACIMIENTO" AND n."AUD_FECHA_CREACION" < $1;
    `,
      'invalid',
      day,
    );

    const valid = Math.max(total - invalid, 0);

    return this.toSemanticDto({
      ruleCode: 'fechaNacimientoAntesDeNotificacion',
      ruleName: 'fechaNacimientoAntesDeNotificacion',
      ruleDescription: `La fecha de nacimiento del paciente dhi_esavi."TR_PACIENTE".FECHA_NACIMIENTO no puede ser posterior a la fecha de notificación dhi_esavi."TR_NOTIFICACION".FECHA_NOTIFICACION`,
      totalRecords: total,
      valid,
      invalid,
    });
  }

  private async validateReferentialIntegrity(day: Date): Promise<SemanticQualityTableDto> {
    const total = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS total
      FROM dhi_esavi."TR_NOTIFICACION" n inner join dhi_esavi."TR_PACIENTE" p on n."PACIENTE_ID" = p."PACIENTE_ID"
      WHERE n."AUD_FECHA_CREACION" < $1;
    `,
      'total',
      day,
    );

    const invalid = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS invalid
      FROM dhi_esavi."TR_NOTIFICACION" n inner join dhi_esavi."TR_PACIENTE" p on n."PACIENTE_ID" = p."PACIENTE_ID"
      WHERE n."PACIENTE_ID" IS NOT NULL AND p."PACIENTE_ID" IS NULL AND n."AUD_FECHA_CREACION" < $1;
    `,
      'invalid',
      day,
    );

    const valid = Math.max(total - invalid, 0);

    return this.toSemanticDto({
      ruleCode: 'integridadReferencialPaciente',
      ruleName: 'integridadReferencialPaciente',
      ruleDescription: `Cada registro en dhi_esavi."TR_NOTIFICACION".PACIENTE_ID debe tener un paciente asociado en dhi_esavi."TR_PACIENTE".PACIENTE_ID`,
      totalRecords: total,
      valid,
      invalid,
    });
  }

  private async fetchCount(query: string, alias: string, day: Date): Promise<number> {
    const [result] = await this.dataSource.query(query, [day]);
    return Number(result?.[alias] ?? 0);
  }

  private toSemanticDto({
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
  }): SemanticQualityTableDto {
    const percentageValidRecords =
      totalRecords === 0 ? 0 : Number(((valid / totalRecords) * 100).toFixed(2));
    const percentageInvalidRecords =
      totalRecords === 0 ? 0 : Number(((invalid / totalRecords) * 100).toFixed(2));
    return {
      ruleCode,
      ruleName,
      ruleDescription,
      totalRecords,
      totalValidRecords: valid,
      totalInvalidRecords: invalid,
      percentageValidRecords,
      percentageInvalidRecords,
    };
  }
}
