// DataProvider para recurso "xlsx" que ahora lee public/data.csv (separador `;`)
// Devuelve getList y getOne; otras operaciones devuelven rejected Promise.

const CSV_FILE = `${window.location.origin}${import.meta.env.BASE_URL || '/'}data.csv`;

let _cachedData: any[] | null = null;

async function loadCsvOnce() {
  if (_cachedData) return _cachedData;
  try {
    console.log('[xlsx.dataprovider] attempting to fetch CSV');
    const relativeUrl = `${import.meta.env.BASE_URL || '/'}data.csv`;
    const attempts = [() => fetch(relativeUrl), () => fetch(CSV_FILE)];

    let resp: Response | null = null;
    const errors: any[] = [];
    for (let i = 0; i < attempts.length; i++) {
      try {
        const attemptUrl = i === 0 ? relativeUrl : CSV_FILE;
        console.log('[xlsx.dataprovider] fetch attempt', i + 1, attemptUrl);
        resp = await attempts[i]();
        console.log('[xlsx.dataprovider] response status', resp.status, 'ok', resp.ok);
        if (resp && resp.ok) break;
        const body = await resp.text().catch(() => '<no body>');
        errors.push({ status: resp.status, body: body.slice(0, 200) });
        resp = null;
      } catch (networkErr) {
        console.error('[xlsx.dataprovider] network error on attempt', i + 1, networkErr);
        errors.push(networkErr);
      }
    }

    if (!resp) {
      console.error('[xlsx.dataprovider] All fetch attempts failed:', errors);
      throw new Error('All fetch attempts for data.csv failed');
    }

    const text = await resp.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
    if (lines.length === 0) {
      _cachedData = [];
      return _cachedData;
    }
    const headerLine = lines.shift() || '';
    const headers = headerLine.split(';').map((h) => h.trim());
    const json = lines.map((line) => {
      const cols = line.split(';');
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i] !== undefined ? cols[i] : '';
      });
      return obj;
    });
    const rows = json.map((r: any, i: number) => ({ id: i + 1, ...r }));
    _cachedData = rows;
    return rows;
  } catch (err) {
    console.error('[xlsx.dataprovider] Error loading csv', err);
    _cachedData = [];
    return _cachedData;
  }
}

export const xlsxDataProvider = {
  getList: async (resource: string, params: any) => {
    const data = await loadCsvOnce();
    const { filter = {}, pagination = { page: 1, perPage: 25 }, sort } = params || {};
    let filtered = data as any[];

    if (filter && Object.keys(filter).length) {
      if (filter.q) {
        const q = String(filter.q).toLowerCase();
        filtered = filtered.filter((row) =>
          Object.values(row).some((v) => String(v).toLowerCase().includes(q))
        );
      } else {
        Object.keys(filter).forEach((key) => {
          const val = filter[key];
          filtered = filtered.filter((r) => String(r[key]) === String(val));
        });
      }
    }

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
    const data = await loadCsvOnce();
    const item = (data as any[]).find((d: any) => String(d.id) === String(params.id));
    if (!item) return Promise.reject(new Error('Not found'));
    return { data: item };
  },

  create: async () => Promise.reject(new Error('Not implemented')),
  update: async () => Promise.reject(new Error('Not implemented')),
  delete: async () => Promise.reject(new Error('Not implemented')),
  getMany: async (resource: string, params: any) => {
    const data = await loadCsvOnce();
    const items = (data as any[]).filter((d) => params.ids.includes(d.id));
    return { data: items };
  },
  getManyReference: async () => Promise.reject(new Error('Not implemented')),
  updateMany: async () => Promise.reject(new Error('Not implemented')),
  deleteMany: async () => Promise.reject(new Error('Not implemented')),
};
