import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { TableCompleteness } from './entities/table-completeness.entity';

const DATAQUALITY_DS = 'DATAQUALITY_DS';

@Injectable()
export class DataqualityService {
  constructor(
    @InjectDataSource(DATAQUALITY_DS) private dataSource: DataSource,
    @InjectRepository(TableCompleteness, DATAQUALITY_DS)
    private tableCompletenessRepository: Repository<TableCompleteness>,
  ) {}

  async getTableCompleteness(tableName: string): Promise<any[]> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const columns = await queryRunner.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'dhi_esavi' AND table_name = $1;`,
        [tableName],
      );

      if (columns.length === 0) {
        throw new InternalServerErrorException(
          `Table '${tableName}' not found or has no columns in schema 'dhi_esavi'.`,
        );
      }

      const completenessData = [];
      const entitiesToSave: TableCompleteness[] = [];

      for (const column of columns) {
        const totalRecordsResult = await queryRunner.query(
          `SELECT COUNT(*) FROM dhi_esavi."${tableName}";`,
        );
        const totalRecords = parseInt(totalRecordsResult[0].count, 10);

        const totalNullsResult = await queryRunner.query(
          `SELECT COUNT(*) FROM dhi_esavi."${tableName}" WHERE "${column.column_name}" IS NULL;`,
        );
        const totalNulls = parseInt(totalNullsResult[0].count, 10);

        const totalNonNulls = totalRecords - totalNulls;
        const completenessPercentage =
          totalRecords === 0 ? 0 : (totalNonNulls / totalRecords) * 100;

        const data = {
          columnName: column.column_name,
          columnDescription: column.data_type,
          totalRecords,
          totalNulls,
          totalNonNulls,
          completenessPercentage: parseFloat(completenessPercentage.toFixed(2)),
        };
        completenessData.push(data);

        const newEntry = this.tableCompletenessRepository.create({
          tableName,
          columnName: data.columnName,
          columnDescription: data.columnDescription,
          totalRecords: data.totalRecords,
          totalNulls: data.totalNulls,
          totalNonNulls: data.totalNonNulls,
          completenessPercentage: data.completenessPercentage,
        });
        entitiesToSave.push(newEntry);
      }

      await this.tableCompletenessRepository.save(entitiesToSave);

      await queryRunner.release();
      return completenessData;
    } catch (error) {
      console.error('Error al obtener la completitud de la tabla:', error.message);
      throw new InternalServerErrorException('Error al procesar la solicitud de calidad de datos.');
    }
  }

  async getAllTables(): Promise<string[]> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const tablesResult = await queryRunner.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'dhi_esavi';`,
      );
      await queryRunner.release();

      return tablesResult.map((row: { table_name: string }) => row.table_name);
    } catch (error) {
      console.error('Error al obtener las tablas:', error.message);
      throw new InternalServerErrorException('Error al obtener las tablas de la base de datos.');
    }
  }

  async getStoredTableCompleteness(tableName?: string): Promise<TableCompleteness[]> {
    const findOptions: any = tableName ? { where: { tableName } } : {};
    return this.tableCompletenessRepository.find(findOptions);
  }
}
