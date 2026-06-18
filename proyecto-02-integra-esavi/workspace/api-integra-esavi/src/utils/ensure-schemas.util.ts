import { DataSource, DataSourceOptions } from 'typeorm';

export function dataSourceFactory(schemas: string[]) {
  return async (options: DataSourceOptions): Promise<DataSource> => {
    const { host, port, username, password, database } = options as any;

    const tempDs = new DataSource({ type: 'postgres', host, port, username, password, database });
    await tempDs.initialize();
    for (const schema of schemas) {
      await tempDs.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    }
    await tempDs.destroy();

    const dataSource = new DataSource(options);
    return dataSource.initialize();
  };
}
