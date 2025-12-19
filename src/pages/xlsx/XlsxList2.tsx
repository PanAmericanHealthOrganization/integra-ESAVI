import { List, Datagrid, TextField, TextInput, Filter, useListContext } from 'react-admin';

const XlsxFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="q" label="Buscar" alwaysOn />
  </Filter>
);

const XlsxDatagrid = () => {
  const { data, ids, isLoading } = useListContext();
  if (isLoading) return null;
  const rows = ids.map((id: any) => data[id]);
  if (!rows || rows.length === 0) return <div>No hay datos en el archivo XLSX.</div>;

  const columns = Object.keys(rows[0] || {}).filter(k => k !== 'id');

  return (
    <Datagrid rowClick={false} bulkActionButtons={false}>
      <TextField source="id" />
      {columns.map(col => (
        <TextField key={col} source={col} />
      ))}
    </Datagrid>
  );
};

export const XlsxList2 = (props: any) => {
  return (
    <List {...props} resource="xlsx" title="Datos de Campos BDD ESAVI" exporter={false} filters={<XlsxFilter />}>
      <XlsxDatagrid />
    </List>
  );
};
