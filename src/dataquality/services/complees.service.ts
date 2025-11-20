import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { CompletenessQualityTableDto } from '../controllers/dto/quality.dto';
import * as moment from 'moment';

export interface ColumnCompletenessDescriptor {
  tableName: string;
  columnName: string;
  columnDescription?: string;
  tableSchema?: string;
}

@Injectable()
export class CompletenessService {
  constructor(
    @InjectDataSource('DATAQUALITY_DS')
    private readonly dataSource: DataSource,
  ) {}

  async obtenerCompletitudDeColumna(
    descriptor: ColumnCompletenessDescriptor,
    day: Date,
  ): Promise<CompletenessQualityTableDto> {
    const schema = descriptor.tableSchema ?? 'public';
    const quotedSchema = this.quoteIdentifier(schema, 'schema');
    const quotedTable = this.quoteIdentifier(descriptor.tableName, 'tabla');
    const quotedColumn = this.quoteIdentifier(descriptor.columnName, 'columna');
    const tableReference = `${quotedSchema}.${quotedTable}`;

    const query = `
      SELECT
        COUNT(*)::BIGINT AS total_records,
        COUNT(*) FILTER (WHERE ${quotedColumn} IS NULL)::BIGINT AS total_nulls
      FROM ${tableReference} t WHERE t."AUD_FECHA_CREACION" <= $1;
    `;
    try {
      const [result] = await this.dataSource.query(query, [
        moment(day).add(1, 'day').endOf('day').toISOString(),
      ]);
      const totalRecords = Number(result?.total_records ?? 0);
      const totalNulls = Number(result?.total_nulls ?? 0);
      const totalNonNulls = totalRecords - totalNulls;
      const completenessPercentage =
        totalRecords === 0 ? 0 : Number(((totalNonNulls / totalRecords) * 100).toFixed(2));

      return {
        tableName: descriptor.tableName,
        columnName: descriptor.columnName,
        columnDescription: descriptor.columnDescription ?? descriptor.columnName,
        totalRecords,
        totalNulls,
        totalNonNulls,
        completenessPercentage,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async obtenerTablasYColumnasDeEsquema(esquema: string): Promise<ColumnCompletenessDescriptor[]> {
    const query = `
      SELECT
        c.table_name,
        c.column_name,
        pgd.description AS column_description
      FROM information_schema.columns c
      LEFT JOIN pg_catalog.pg_class cls
        ON cls.relname = c.table_name
        AND cls.relnamespace = (
          SELECT oid FROM pg_catalog.pg_namespace WHERE nspname = c.table_schema
        )
      LEFT JOIN pg_catalog.pg_description pgd
        ON pgd.objoid = cls.oid
        AND pgd.objsubid = c.ordinal_position
      WHERE c.table_schema = $1
      ORDER BY c.table_name, c.ordinal_position;
    `;
    const result = await this.dataSource.query(query, [esquema]);
    return result.map((row: any) => ({
      tableName: row.table_name,
      columnName: row.column_name,
      columnDescription: row.column_description ?? row.column_name,
      tableSchema: esquema,
    }));
  }

  async obtenerCompletitudDeEsquema(
    esquema: string,
    date: Date,
  ): Promise<CompletenessQualityTableDto[]> {
    const tablasYColumnas = await this.obtenerTablasYColumnasDeEsquema(esquema);
    const columnasValidas = tablasYColumnas.filter(
      (columna) => !columna.columnName.toUpperCase().startsWith('AUD'),
    );
    return Promise.all(
      columnasValidas.map(async (tablaYColumna) => {
        return this.obtenerCompletitudDeColumna(tablaYColumna, date);
      }),
    );
  }

  private quoteIdentifier(identifier: string, label: string): string {
    if (!identifier || !/^[A-Za-z0-9_]+$/.test(identifier)) {
      throw new Error(`Identificador inválido para ${label}: "${identifier}"`);
    }
    return `"${identifier}"`;
  }
}
