// DataProvider minimal para recurso "xlsx" que lee public/data.xlsx
// Devuelve getList y getOne; otras operaciones devuelven rejected Promise.

const XLSX_FILE = '/data.xlsx';

async function ensureXLSX() {
  if (!(window as any).XLSX) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });
  }
}

let _cachedData: any[] | null = null;

async function loadXlsxOnce() {
  if (_cachedData) return _cachedData;
  try {
    await ensureXLSX();
    const resp = await fetch(XLSX_FILE);
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
    const arrayBuffer = await resp.arrayBuffer();
    const workbook = (window as any).XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = (window as any).XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const rows = json.map((r: any, i: number) => ({ id: i + 1, ...r }));
    _cachedData = rows;
    return rows;
  } catch (err) {
    console.error('[xlsx.dataprovider] Error loading xlsx', err);
    _cachedData = [];
    return _cachedData;
  }
}

export const xlsxDataProvider = {
  getList: async (resource: string, params: any) => {
    const data = await loadXlsxOnce();
    // Manejar filtros (q => búsqueda full-text) y paginación
    const { filter = {}, pagination = { page: 1, perPage: 25 }, sort } = params || {};
    let filtered = data as any[];

    if (filter && Object.keys(filter).length) {
      if (filter.q) {
        const q = String(filter.q).toLowerCase();
        filtered = filtered.filter(row =>
          Object.values(row).some(v => String(v).toLowerCase().includes(q))
        );
      } else {
        // exact match filters for specific fields
        Object.keys(filter).forEach(key => {
          const val = filter[key];
          filtered = filtered.filter(r => String(r[key]) === String(val));
        });
      }
    }

    // Sorting (simple string/number compare)
    if (sort && sort.field) {
      const { field, order } = sort;
      filtered = filtered.sort((a: any, b: any) => {
        const va = a[field];
        const vb = b[field];
        if (va == null) return 1;
        if (vb == null) return -1;
        if (va === vb) return 0;
        const comp = va > vb ? 1 : -1;
        return order === 'ASC' ? comp : -comp;
      });
    }

    const total = filtered.length;
    const { page = 1, perPage = 25 } = pagination;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pageData = filtered.slice(start, end);

    return { data: pageData, total };
  },

  getOne: async (resource: string, params: any) => {
    const data = await loadXlsxOnce();
    const item = (data as any[]).find((d: any) => String(d.id) === String(params.id));
    if (!item) return Promise.reject(new Error('Not found'));
    return { data: item };
  },

  // Operaciones no soportadas en este dataProvider local
  create: async () => Promise.reject(new Error('Not implemented')),
  update: async () => Promise.reject(new Error('Not implemented')),
  delete: async () => Promise.reject(new Error('Not implemented')),
  getMany: async (resource: string, params: any) => {
    const data = await loadXlsxOnce();
    const items = (data as any[]).filter(d => params.ids.includes(d.id));
    return { data: items };
  },
  getManyReference: async () => Promise.reject(new Error('Not implemented')),
  updateMany: async () => Promise.reject(new Error('Not implemented')),
  deleteMany: async () => Promise.reject(new Error('Not implemented')),
};
