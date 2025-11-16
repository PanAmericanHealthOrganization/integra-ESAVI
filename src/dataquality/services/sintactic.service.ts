import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SintacticQualityDto } from '../controllers/dto/quality.dto';

@Injectable()
export class SintacticService {
  private readonly schemaName = 'dhi_esavi';
  private readonly tableName = 'TR_PACIENTE';
  private readonly columnName = 'NOMBRE';

  constructor(
    @InjectDataSource('DATAQUALITY_DS')
    private readonly dataSource: DataSource,
  ) {}

  async sintacticQuality(day: Date): Promise<SintacticQualityDto[]> {
    return Promise.all([
      this.nombresNoDebeTenerCaracteresEspeciales(day),
      this.nombresDebeSerMayorA4caracteres(day),
      this.formatoFechaValido(day),
    ]);
  }

  private async nombresNoDebeTenerCaracteresEspeciales(day: Date): Promise<SintacticQualityDto> {
    const { total, valid } = await this.evaluateRule(
      `${this.columnReference()} ~ '[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\\s]'`,
      day,
    );

    return {
      regla: 'nombresNoDebeTenerCaracteresEspeciales',
      condicion: 'El nombre no debe contener caracteres especiales',
      descripcionRegla: 'Detecta nombres con caracteres diferentes a letras, números o espacios',
      totalRegistros: total,
      totalRegistrosValidos: valid,
      porcentajeRegistrosValidos: this.calculatePercentage(valid, total),
    };
  }

  private async nombresDebeSerMayorA4caracteres(day: Date): Promise<SintacticQualityDto> {
    const { total, valid } = await this.evaluateRule(`LENGTH(${this.columnReference()}) > 4`, day);

    return {
      regla: 'nombresDebeSerMayorA4caracteres',
      condicion: 'El nombre debe contener más de 4 caracteres',
      descripcionRegla: 'Verifica la longitud mínima permitida para el campo nombre',
      totalRegistros: total,
      totalRegistrosValidos: valid,
      porcentajeRegistrosValidos: this.calculatePercentage(valid, total),
    };
  }

  private async formatoFechaValido(day: Date): Promise<SintacticQualityDto> {
    return this.buildDateFormatResult(
      'formatoFechaValido',
      'La fecha debe estar en formato YYYY-MM-DD',
      'Verifica que la fecha esté en formato YYYY-MM-DD',
      this.columnReference(),
      day,
    );
  }

  private async buildDateFormatResult(
    ruleName: string,
    condition: string,
    description: string,
    column: string,
    day: Date,
  ): Promise<SintacticQualityDto> {
    const tableReference = `${this.schemaReference()}.${this.tableReference()}`;

    const totalQuery = `
      SELECT COUNT(*)::BIGINT AS total
      FROM ${tableReference} t WHERE t."AUD_FECHA_CREACION" <= $1;
    `;

    const invalidQuery = `
      SELECT COUNT(*)::BIGINT AS invalid
      FROM ${tableReference} t
      WHERE (${column} IS NULL
        OR ${column} !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        OR TO_DATE(${column}, 'YYYY-MM-DD') IS NULL ) AND t."AUD_FECHA_CREACION" <= $1;
    `;
    const [totalResult] = await this.dataSource.query(totalQuery, [day]);
    const [invalidResult] = await this.dataSource.query(invalidQuery, [day]);

    const total = Number(totalResult?.total ?? 0);
    const invalid = Number(invalidResult?.invalid ?? 0);
    const valid = total - invalid < 0 ? 0 : total - invalid;

    return {
      regla: ruleName,
      condicion: condition,
      descripcionRegla: description,
      totalRegistros: total,
      totalRegistrosValidos: valid,
      porcentajeRegistrosValidos: this.calculatePercentage(valid, total),
    };
  }

  private async evaluateRule(
    condition: string,
    day: Date,
  ): Promise<{ total: number; valid: number }> {
    const tableReference = `${this.schemaReference()}.${this.tableReference()}`;
    const totalQuery = `
      SELECT COUNT(*)::BIGINT AS total
      FROM ${tableReference} t WHERE t."AUD_FECHA_CREACION" <= $1;
    `;
    const invalidQuery = `
      SELECT COUNT(*)::BIGINT AS invalid
      FROM ${tableReference} t
      WHERE ${condition} OR ${this.columnReference()} IS NULL AND t."AUD_FECHA_CREACION" <=  $1;
    `;

    const [totalResult] = await this.dataSource.query(totalQuery, [day]);
    const [invalidResult] = await this.dataSource.query(invalidQuery, [day]);

    const total = Number(totalResult?.total ?? 0);
    const invalid = Number(invalidResult?.invalid ?? 0);
    const valid = total - invalid < 0 ? 0 : total - invalid;

    return { total, valid };
  }

  private calculatePercentage(valid: number, total: number): number {
    if (total === 0) {
      return 0;
    }
    return Number(((valid / total) * 100).toFixed(2));
  }

  private schemaReference(): string {
    return this.quoteIdentifier(this.schemaName);
  }

  private tableReference(): string {
    return this.quoteIdentifier(this.tableName);
  }

  private columnReference(): string {
    return this.quoteIdentifier(this.columnName);
  }

  private quoteIdentifier(identifier: string): string {
    if (!identifier || !/^[a-zA-Z0-9_]+$/.test(identifier)) {
      throw new Error(`Identificador inválido: "${identifier}"`);
    }
    return `"${identifier}"`;
  }
}
