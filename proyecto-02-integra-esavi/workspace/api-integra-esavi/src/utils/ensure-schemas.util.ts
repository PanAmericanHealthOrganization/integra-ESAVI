import { DataSource, DataSourceOptions } from 'typeorm';

export function dataSourceFactory(schemas: string[]) {
  return async (options: DataSourceOptions): Promise<DataSource> => {
    const { host, port, username, password, database } = options as any;

    const tempDs = new DataSource({ type: 'postgres', host, port, username, password, database });
    await tempDs.initialize();
    for (const schema of schemas) {
      try {
        await tempDs.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      } catch (err: any) {
        // 23505 = unique_violation: concurrent connections both passed the IF NOT EXISTS
        // check before either committed — schema was created by the other connection.
        if (err?.code !== '23505') throw err;
      }
    }
    await tempDs.destroy();

    const dataSource = new DataSource(options);
    return dataSource.initialize();
  };
}
