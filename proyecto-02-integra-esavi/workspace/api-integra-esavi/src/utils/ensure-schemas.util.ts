import { DataSource, DataSourceOptions } from 'typeorm';

export function dataSourceFactory(schemas: string[]) {
  return async (options: DataSourceOptions): Promise<DataSource> => {
    const { host, port, username, password, database } = options as any;

    const tempDs = new DataSource({ type: 'postgres', host, port, username, password, database });
    await tempDs.initialize();
    for (const schema of schemas) {
      try {
        await tempDs.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      } catch (e: any) {
        // race condition: two connections both checked "not exists" at the same time
        if (e?.code !== '23505') throw e;
      }
    }
    await tempDs.destroy();

    const dataSource = new DataSource(options);
    return dataSource.initialize();
  };
}
