import { useEffect, useState } from 'react';
import { List, Datagrid, TextField, TextInput, Filter } from 'react-admin';


// Cambia el nombre del archivo según el que esté en public/
const XLSX_FILE = '/data.xlsx';

const XlsxFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="q" label="Buscar" alwaysOn />
  </Filter>
);

const fetchXlsxData = async () => {
  try {
    console.log('[XLSX] Iniciando carga de SheetJS y archivo XLSX');
    if (!window.XLSX) {
      console.log('[XLSX] SheetJS no está presente, cargando desde CDN...');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.async = true;
        script.onload = () => { console.log('[XLSX] SheetJS cargado'); resolve(); };
        script.onerror = (e) => { console.error('[XLSX] Error cargando SheetJS', e); reject(e); };
        document.body.appendChild(script);
      });
    }
    const response = await fetch(XLSX_FILE);
    if (!response.ok) {
      console.error('[XLSX] Error al obtener el archivo:', response.status, response.statusText);
      throw new Error('No se pudo obtener el archivo XLSX');
    }
    const arrayBuffer = await response.arrayBuffer();
    console.log('[XLSX] Archivo XLSX cargado, tamaño:', arrayBuffer.byteLength);
    const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
    console.log('[XLSX] Workbook:', workbook);
    const sheetName = workbook.SheetNames[0];
    console.log('[XLSX] Primera hoja:', sheetName);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.error('[XLSX] No se encontró la hoja en el archivo XLSX');
      throw new Error('No se encontró la hoja en el archivo XLSX');
    }
    const json = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });
    console.log('[XLSX] Datos parseados:', json);
    return json.map((row, idx) => ({ id: idx + 1, ...row }));
  } catch (err) {
    console.error('[XLSX] Error procesando archivo:', err);
    return [];
  }
};

export const XlsxList = (props: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchXlsxData().then(rows => {
      setData(rows);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Cargando datos XLSX...</div>;
  if (!data.length) return <div>No hay datos en el archivo XLSX.</div>;

  // Obtén las columnas dinámicamente
  const columns = Object.keys(data[0] || {}).filter(key => key !== 'id');

  return (

    


    <List {...props} resource="xlsx" title="Datos de Campos BDD ESAVI" exporter={false} filters={<XlsxFilter />}>
      <Datagrid rowClick={false} bulkActionButtons={false}>
        <TextField source="id" />
        {columns.map(col => (
          <TextField key={col} source={col} />
        ))}
      </Datagrid>
    </List>

   

    
  );
};
