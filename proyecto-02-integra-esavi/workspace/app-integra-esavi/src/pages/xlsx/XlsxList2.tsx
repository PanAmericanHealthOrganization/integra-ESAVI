import { List, Datagrid, TextField, TextInput, Filter, useListContext } from 'react-admin';

const XlsxFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="q" label="Buscar" alwaysOn />
  </Filter>
);

const XlsxDatagrid = () => {
  const { data, ids, isLoading } = useListContext();
  if (isLoading) return null;
  // Debugging: log shapes to help diagnose empty-list issues
  try {
    // eslint-disable-next-line no-console
    console.log('[XlsxDatagrid] data type', Array.isArray(data) ? 'array' : typeof data, 'ids', ids?.length);
  } catch (e) {}

  let rows: any[] = [];
  if (Array.isArray(data)) {
    rows = data as any[];
  } else if (ids && data) {
    rows = ids.map((id: any) => data[id]).filter(Boolean);
  } else if (data && typeof data === 'object') {
    rows = Object.values(data as any);
  }

  if (!rows || rows.length === 0) return <div>No hay datos en el archivo CSV.</div>;

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
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Datos de Campos BDD ESAVI</h2>
        <div style={{ color: '#888', fontSize: 14 }}>
          <a href="/#/dashboard" style={{ color: '#888', textDecoration: 'underline', cursor: 'pointer' }}>Inicio</a> / Datos de Campos BDD ESAVI
        </div>
      </div>
      <List {...props} resource="xlsx" title="Datos de Campos BDD ESAVI" exporter={false} filters={<XlsxFilter />}>
        <XlsxDatagrid />
      </List>
    </>
  );
};
