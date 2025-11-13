import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SemanticQualityTableDto } from '../controllers/dto/quality.dto';

@Injectable()
export class SemanticService {
  private readonly schemaName = 'dhi_esavi';
  private readonly notificationTableName = 'TR_NOTIFICACION';
  private readonly patientTableName = 'TR_PACIENTE';

  private readonly ageColumn = 'EDAD';
  private readonly birthDateColumn = 'FECHA_NACIMIENTO';
  private readonly notificationDateColumn = 'FECHA_NOTIFICACION';
  private readonly patientIdColumn = 'PACIENTE_ID';

  constructor(
    @InjectDataSource('DATAQUALITY_DS')
    private readonly dataSource: DataSource,
  ) {}

  async semanticQuality(): Promise<SemanticQualityTableDto[]> {
    return Promise.all([
      this.validateMinAge(),
      this.validateMaxAge(),
      this.validateBirthDateNotAfterNotification(),
      this.validateReferentialIntegrity(),
    ]);
  }

  private async validateMinAge(): Promise<SemanticQualityTableDto> {
    const notificationTable = this.qualifiedTable(this.notificationTableName, 'n');
    const ageColumn = this.columnReference('n', this.ageColumn);

    const total = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS total
      FROM ${this.qualifiedTable(this.notificationTableName)};
    `,
      'total',
    );

    const invalid = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS invalid
      FROM ${notificationTable}
      WHERE ${ageColumn} IS NULL OR ${ageColumn} < 0;
    `,
      'invalid',
    );

    const valid = Math.max(total - invalid, 0);

    return this.toSemanticDto({
      ruleCode: 'edadNoNegativa',
      ruleName: 'edadNoNegativa',
      ruleDescription: `La edad registrada en ${this.notificationTableName}.${this.ageColumn} no debe ser negativa`,
      totalRecords: total,
      valid,
      invalid,
    });
  }

  private async validateMaxAge(): Promise<SemanticQualityTableDto> {
    const notificationTable = this.qualifiedTable(this.notificationTableName, 'n');
    const ageColumn = this.columnReference('n', this.ageColumn);

    const total = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS total
      FROM ${this.qualifiedTable(this.notificationTableName)};
    `,
      'total',
    );

    const invalid = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS invalid
      FROM ${notificationTable}
      WHERE ${ageColumn} IS NULL OR ${ageColumn} > 100;
    `,
      'invalid',
    );

    const valid = Math.max(total - invalid, 0);

    return this.toSemanticDto({
      ruleCode: 'edadNoMayorA100',
      ruleName: 'edadNoMayorA100',
      ruleDescription: `La edad registrada en ${this.notificationTableName}.${this.ageColumn} no debe superar los 100 años`,
      totalRecords: total,
      valid,
      invalid,
    });
  }

  private async validateBirthDateNotAfterNotification(): Promise<SemanticQualityTableDto> {
    const notificationTable = this.qualifiedTable(this.notificationTableName, 'n');
    const patientTable = this.qualifiedTable(this.patientTableName, 'p');
    const joinClause = `
      INNER JOIN ${patientTable}
        ON ${this.columnReference('n', this.patientIdColumn)} = ${this.columnReference(
      'p',
      this.patientIdColumn,
    )}
    `;

    const total = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS total
      FROM ${notificationTable}
      ${joinClause};
    `,
      'total',
    );

    const birthDate = this.columnReference('p', this.birthDateColumn);
    const notificationDate = this.columnReference('n', this.notificationDateColumn);
    const invalidCondition = [
      `${birthDate} IS NULL`,
      `${notificationDate} IS NULL`,
      `${birthDate} > ${notificationDate}`,
    ].join(' OR ');

    const invalid = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS invalid
      FROM ${notificationTable}
      ${joinClause}
      WHERE ${invalidCondition};
    `,
      'invalid',
    );

    const valid = Math.max(total - invalid, 0);

    return this.toSemanticDto({
      ruleCode: 'fechaNacimientoAntesDeNotificacion',
      ruleName: 'fechaNacimientoAntesDeNotificacion',
      ruleDescription: `La fecha de nacimiento del paciente (${this.patientTableName}.${this.birthDateColumn}) no puede ser posterior a la fecha de notificación (${this.notificationTableName}.${this.notificationDateColumn})`,
      totalRecords: total,
      valid,
      invalid,
    });
  }

  private async validateReferentialIntegrity(): Promise<SemanticQualityTableDto> {
    const notificationTable = this.qualifiedTable(this.notificationTableName, 'n');
    const patientTable = this.qualifiedTable(this.patientTableName, 'p');
    const joinClause = `
      LEFT JOIN ${patientTable}
        ON ${this.columnReference('n', this.patientIdColumn)} = ${this.columnReference(
      'p',
      this.patientIdColumn,
    )}
    `;

    const total = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS total
      FROM ${notificationTable}
      ${joinClause};
    `,
      'total',
    );

    const invalid = await this.fetchCount(
      `
      SELECT COUNT(*)::BIGINT AS invalid
      FROM ${notificationTable}
      ${joinClause}
      WHERE ${this.columnReference('n', this.patientIdColumn)} IS NOT NULL
        AND ${this.columnReference('p', this.patientIdColumn)} IS NULL;
    `,
      'invalid',
    );

    const valid = Math.max(total - invalid, 0);

    return this.toSemanticDto({
      ruleCode: 'integridadReferencialPaciente',
      ruleName: 'integridadReferencialPaciente',
      ruleDescription: `Cada registro en ${this.notificationTableName}.${this.patientIdColumn} debe tener un paciente asociado en ${this.patientTableName}.${this.patientIdColumn}`,
      totalRecords: total,
      valid,
      invalid,
    });
  }

  private async fetchCount(query: string, alias: string): Promise<number> {
    const [result] = await this.dataSource.query(query);
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

  private qualifiedTable(table: string, alias?: string): string {
    const schema = `"${this.schemaName}"`;
    const tableName = `"${table}"`;
    const aliasClause = alias ? ` ${alias}` : '';
    return `${schema}.${tableName}${aliasClause}`;
  }

  private columnReference(alias: string, column: string): string {
    return `${alias}."${column}"`;
  }
}
