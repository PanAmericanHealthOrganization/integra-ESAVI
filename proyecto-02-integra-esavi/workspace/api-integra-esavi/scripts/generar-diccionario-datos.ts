/**
 * Generador del diccionario de datos de las tablas TR_ del esquema DHI_ESAVI.
 *
 * Para cada columna determina el dominio de valores posibles combinando:
 *   - tipos ENUM de PostgreSQL (lista cerrada declarada en el modelo)
 *   - catálogos TC_CATALOGO_PADRE (lista cerrada administrable por FK)
 *   - tablas de referencia (TC_DPA_*, TR_ESTABLECIMIENTO, ...)
 *   - valores observados en la base cuando la cardinalidad es baja
 *   - rangos (fechas, numéricos) y estadísticas de longitud para texto libre
 *
 * Salida: docs/diccionario-datos-TR.xlsx, con una hoja por tabla TR_ más las
 * hojas Léeme, Tablas, Diccionario (consolidado), Catálogos y Resumen dominios.
 *
 * Uso:
 *   pnpm exec ts-node scripts/generar-diccionario-datos.ts
 *   pnpm exec ts-node scripts/generar-diccionario-datos.ts --con-auditoria --umbral=80
 */
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { utils, writeFile, WorkBook, WorkSheet } from 'xlsx';

dotenv.config();

/** Columnas CT_*_ID cuyo catálogo padre está fijado en el código de los servicios. */
const CATALOGO_PADRE_POR_COLUMNA: Record<string, string> = {
  CT_SEXO_ID: 'GENERO',
  CT_AUTO_IDENTIFICACION_ETNICA_ID: 'ETNIA',
  CT_PROFESION_ID: 'OCUPACION',
  CT_ROL_VACUNA_ID: 'CARACTERIZACION_VACUNA',
  CTUNIDADEDAD_ID: 'UNIDAD_EDAD',
  CT_TIPO_EMISOR_ID: 'TIPO_EMISOR',
  CT_TIPO_REPORTE_ID: 'TIPO_REPORTE',
  TIPO_ENTIDAD: 'ENTIDAD',
};

const COLUMNAS_AUDITORIA = [
  'AUD_FECHA_CREACION',
  'AUD_USUARIO_CREACION',
  'AUD_FECHA_ACTUALIZACION',
  'AUD_USUARIO_ACTUALIZACION',
  'AUD_FECHA_ELIMINACION',
  'AUD_USUARIO_ELIMINACION',
  'AUD_HABILITADO',
  'AUD_ESTADO',
];

type TipoDominio =
  | 'ENUM'
  | 'CATALOGO'
  | 'REFERENCIA'
  | 'BOOLEANO'
  | 'VALORES_OBSERVADOS'
  | 'TEXTO_LIBRE'
  | 'RANGO_FECHA'
  | 'RANGO_NUMERICO'
  | 'JSON'
  | 'IDENTIFICADOR'
  | 'SIN_DATOS';

interface ColumnaDiccionario {
  esquema: string;
  tabla: string;
  columna: string;
  tipo: string;
  nulable: boolean;
  porDefecto: string | null;
  comentario: string | null;
  tipoDominio: TipoDominio;
  valoresPosibles: string[];
  detalle: string;
  totalFilas: number;
  noNulos: number;
  distintos: number | null;
}

abstract class DiccionarioUtils {
  static readonly ESQUEMA = 'DHI_ESAVI';

  static id(nombre: string): string {
    return `"${nombre.replace(/"/g, '""')}"`;
  }

  static tabla(nombre: string): string {
    return `${DiccionarioUtils.id(DiccionarioUtils.ESQUEMA)}.${DiccionarioUtils.id(nombre)}`;
  }

  static esFecha(tipo: string): boolean {
    return /^(timestamp|date)/.test(tipo);
  }

  static esNumerico(tipo: string): boolean {
    return /^(integer|bigint|smallint|numeric|double|real)/.test(tipo);
  }

  static esTexto(tipo: string): boolean {
    return /^(character|text)/.test(tipo);
  }

  static porcentaje(parte: number, total: number): string {
    if (!total) return '0%';
    return `${((parte / total) * 100).toFixed(1)}%`;
  }

  static truncar(valor: string, max = 120): string {
    const limpio = valor.replace(/\s+/g, ' ').trim();
    return limpio.length > max ? `${limpio.slice(0, max)}…` : limpio;
  }

  /** Hoja a partir de una matriz, con anchos de columna fijados. */
  static hoja(filas: unknown[][], anchos: number[]): WorkSheet {
    const hoja = utils.aoa_to_sheet(filas);
    hoja['!cols'] = anchos.map((w) => ({ wch: w }));
    return hoja;
  }

  /**
   * Nombre de hoja válido para Excel: máximo 31 caracteres, sin `[]:*?/\`.
   * `usados` acumula los ya asignados para desambiguar los nombres truncados.
   */
  static nombreHoja(tabla: string, usados: Set<string>): string {
    const limpio = tabla.replace(/[[\]:*?/\\]/g, '_');
    let nombre = limpio.slice(0, 31);
    let n = 2;
    while (usados.has(nombre)) {
      const sufijo = `~${n++}`;
      nombre = `${limpio.slice(0, 31 - sufijo.length)}${sufijo}`;
    }
    usados.add(nombre);
    return nombre;
  }
}

interface Contexto {
  enums: Map<string, string[]>;
  fks: Map<string, { tablaRef: string; columnaRef: string }>;
  catalogos: Map<string, { codigo: string; nombre: string; descripcion: string | null }[]>;
  catalogoPorId: Map<string, { padre: string; nombre: string }>;
  filasPorTabla: Map<string, number>;
  umbralValores: number;
}

async function cargarContexto(cliente: Client, umbralValores: number): Promise<Contexto> {
  const enums = new Map<string, string[]>();
  const resEnums = await cliente.query<{ typname: string; labels: string[] }>(`
    select t.typname, array_agg(e.enumlabel::text order by e.enumsortorder) as labels
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    group by t.typname
  `);
  resEnums.rows.forEach((r) => enums.set(r.typname, r.labels));

  const fks = new Map<string, { tablaRef: string; columnaRef: string }>();
  const resFk = await cliente.query<{
    tabla: string;
    columna: string;
    tabla_ref: string;
    columna_ref: string;
  }>(
    `
    select tc.table_name as tabla, kcu.column_name as columna,
           ccu.table_name as tabla_ref, ccu.column_name as columna_ref
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name and kcu.constraint_schema = tc.constraint_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name and ccu.constraint_schema = tc.constraint_schema
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = $1
  `,
    [DiccionarioUtils.ESQUEMA],
  );
  resFk.rows.forEach((r) =>
    fks.set(`${r.tabla}.${r.columna}`, { tablaRef: r.tabla_ref, columnaRef: r.columna_ref }),
  );

  const catalogos = new Map<string, { codigo: string; nombre: string; descripcion: string | null }[]>();
  const catalogoPorId = new Map<string, { padre: string; nombre: string }>();
  const resCat = await cliente.query<{
    id: string;
    padre: string;
    codigo: string;
    nombre: string;
    descripcion: string | null;
  }>(`
    select h."ID" as id, p."CODIGO" as padre, h."CODIGO" as codigo, h."NOMBRE" as nombre, h."DESCRIPCION" as descripcion
    from ${DiccionarioUtils.tabla('TC_CATALOGO_PADRE')} h
    join ${DiccionarioUtils.tabla('TC_CATALOGO_PADRE')} p on p."ID" = h."ID_PADRE"
    order by p."CODIGO", h."NOMBRE"
  `);
  resCat.rows.forEach((r) => {
    if (!catalogos.has(r.padre)) catalogos.set(r.padre, []);
    catalogos.get(r.padre)!.push({ codigo: r.codigo, nombre: r.nombre, descripcion: r.descripcion });
    catalogoPorId.set(r.id, { padre: r.padre, nombre: r.nombre });
  });

  const filasPorTabla = new Map<string, number>();
  const resTablas = await cliente.query<{ tabla: string }>(
    `select table_name as tabla from information_schema.tables
     where table_schema = $1 and table_type = 'BASE TABLE' order by table_name`,
    [DiccionarioUtils.ESQUEMA],
  );
  for (const { tabla } of resTablas.rows) {
    const res = await cliente.query<{ n: string }>(
      `select count(*)::text as n from ${DiccionarioUtils.tabla(tabla)}`,
    );
    filasPorTabla.set(tabla, Number(res.rows[0].n));
  }

  return { enums, fks, catalogos, catalogoPorId, filasPorTabla, umbralValores };
}

/** Resuelve el dominio de valores de una columna concreta. */
async function describirColumna(
  cliente: Client,
  ctx: Contexto,
  meta: {
    tabla: string;
    columna: string;
    tipo: string;
    udt: string;
    nulable: boolean;
    porDefecto: string | null;
    comentario: string | null;
  },
): Promise<ColumnaDiccionario> {
  const { tabla, columna, tipo, udt } = meta;
  const totalFilas = ctx.filasPorTabla.get(tabla) ?? 0;
  const ref = DiccionarioUtils.tabla(tabla);
  const col = DiccionarioUtils.id(columna);

  const base = {
    esquema: DiccionarioUtils.ESQUEMA,
    tabla,
    columna,
    tipo: tipo === 'USER-DEFINED' ? udt : tipo,
    nulable: meta.nulable,
    porDefecto: meta.porDefecto,
    comentario: meta.comentario,
    totalFilas,
  };

  const conteos = await cliente.query<{ no_nulos: string; distintos: string }>(
    `select count(${col})::text as no_nulos, count(distinct ${col})::text as distintos from ${ref}`,
  );
  const noNulos = Number(conteos.rows[0].no_nulos);
  const distintos = Number(conteos.rows[0].distintos);

  const observados = async (limite: number): Promise<{ valor: string; n: number }[]> => {
    const res = await cliente.query<{ v: string | null; n: string }>(
      `select ${col}::text as v, count(*)::text as n from ${ref}
       where ${col} is not null group by 1 order by 2 desc, 1 limit ${limite}`,
    );
    return res.rows.map((r) => ({ valor: r.v ?? '', n: Number(r.n) }));
  };

  // 1) ENUM declarado en el modelo: lista cerrada, independiente de los datos.
  if (ctx.enums.has(udt)) {
    const labels = ctx.enums.get(udt)!;
    const usados = await observados(labels.length);
    const mapa = new Map(usados.map((u) => [u.valor, u.n]));
    return {
      ...base,
      tipoDominio: 'ENUM',
      valoresPosibles: labels.map((l) => `${l}${mapa.has(l) ? ` (${mapa.get(l)})` : ''}`),
      detalle: `Tipo ENUM \`${udt}\`: lista cerrada, cualquier otro valor es rechazado por la base.`,
      noNulos,
      distintos,
    };
  }

  // 2) FK al catálogo administrable: el dominio son las subcategorías del padre.
  const fk = ctx.fks.get(`${tabla}.${columna}`);
  if (fk && fk.tablaRef === 'TC_CATALOGO_PADRE') {
    let padre = CATALOGO_PADRE_POR_COLUMNA[columna] ?? null;
    const usados = await observados(200);
    if (!padre) {
      const inferido = usados.map((u) => ctx.catalogoPorId.get(u.valor)?.padre).filter(Boolean);
      padre = inferido.length ? (inferido[0] as string) : null;
    }
    const hijos = padre ? (ctx.catalogos.get(padre) ?? []) : [];
    const usoPorNombre = new Map<string, number>();
    usados.forEach((u) => {
      const nombre = ctx.catalogoPorId.get(u.valor)?.nombre;
      if (nombre) usoPorNombre.set(nombre, u.n);
    });
    return {
      ...base,
      tipoDominio: 'CATALOGO',
      valoresPosibles: hijos.map(
        (h) => `${h.nombre}${usoPorNombre.has(h.nombre) ? ` (${usoPorNombre.get(h.nombre)})` : ''}`,
      ),
      detalle: padre
        ? `FK a TC_CATALOGO_PADRE, categoría \`${padre}\` (${hijos.length} valores). Lista administrable: se amplía cargando filas en el catálogo.`
        : 'FK a TC_CATALOGO_PADRE; la categoría no pudo inferirse (columna sin datos y sin mapeo en el código).',
      noNulos,
      distintos,
    };
  }

  // 3) FK a tabla de referencia (parroquias, establecimientos, notificación padre...).
  if (fk) {
    const filasRef = ctx.filasPorTabla.get(fk.tablaRef) ?? 0;
    return {
      ...base,
      tipoDominio: 'REFERENCIA',
      valoresPosibles: [],
      detalle: `FK → ${fk.tablaRef}.${fk.columnaRef} (${filasRef} registros vigentes). El valor es un identificador, no un dato de negocio.`,
      noNulos,
      distintos,
    };
  }

  if (tipo === 'boolean') {
    const res = await cliente.query<{ v: boolean | null; n: string }>(
      `select ${col} as v, count(*)::text as n from ${ref} group by 1 order by 1`,
    );
    return {
      ...base,
      tipoDominio: 'BOOLEANO',
      valoresPosibles: ['true', 'false', ...(meta.nulable ? ['null'] : [])],
      detalle: res.rows.map((r) => `${r.v === null ? 'null' : r.v}: ${r.n}`).join(' · ') || 'sin datos',
      noNulos,
      distintos,
    };
  }

  if (udt === 'uuid' && columna === 'ID') {
    return {
      ...base,
      tipoDominio: 'IDENTIFICADOR',
      valoresPosibles: [],
      detalle: 'UUID v4 generado por la base (PK). Sin dominio de negocio.',
      noNulos,
      distintos,
    };
  }

  if (udt === 'jsonb' || udt === 'json') {
    let claves: string[] = [];
    try {
      const res = await cliente.query<{ k: string; n: string }>(
        `select k, count(*)::text as n from ${ref}, lateral jsonb_object_keys(${col}::jsonb) k
         where ${col} is not null group by 1 order by 2 desc limit 40`,
      );
      claves = res.rows.map((r) => `${r.k} (${r.n})`);
    } catch {
      claves = [];
    }
    return {
      ...base,
      tipoDominio: 'JSON',
      valoresPosibles: claves,
      detalle: 'Documento JSON con los valores crudos del origen; el dominio son sus claves, no valores cerrados.',
      noNulos,
      distintos,
    };
  }

  if (DiccionarioUtils.esFecha(tipo)) {
    const res = await cliente.query<{ min: string | null; max: string | null }>(
      `select min(${col})::text as min, max(${col})::text as max from ${ref}`,
    );
    const { min, max } = res.rows[0];
    return {
      ...base,
      tipoDominio: 'RANGO_FECHA',
      valoresPosibles: [],
      detalle: min ? `Rango observado: ${min} → ${max}` : 'Sin datos cargados',
      noNulos,
      distintos,
    };
  }

  if (DiccionarioUtils.esNumerico(tipo)) {
    if (distintos > 0 && distintos <= ctx.umbralValores) {
      const vals = await observados(ctx.umbralValores);
      return {
        ...base,
        tipoDominio: 'VALORES_OBSERVADOS',
        valoresPosibles: vals.map((v) => `${v.valor} (${v.n})`),
        detalle: `${distintos} valores distintos observados. Dominio no restringido por la base.`,
        noNulos,
        distintos,
      };
    }
    const res = await cliente.query<{ min: string | null; max: string | null; prom: string | null }>(
      `select min(${col})::text as min, max(${col})::text as max, round(avg(${col})::numeric, 2)::text as prom from ${ref}`,
    );
    const { min, max, prom } = res.rows[0];
    return {
      ...base,
      tipoDominio: min ? 'RANGO_NUMERICO' : 'SIN_DATOS',
      valoresPosibles: [],
      detalle: min ? `Rango observado: ${min} → ${max} (promedio ${prom})` : 'Sin datos cargados',
      noNulos,
      distintos,
    };
  }

  if (DiccionarioUtils.esTexto(tipo)) {
    if (distintos === 0) {
      return {
        ...base,
        tipoDominio: 'SIN_DATOS',
        valoresPosibles: [],
        detalle: 'Columna sin datos cargados en este ambiente: dominio no observable.',
        noNulos,
        distintos,
      };
    }
    const largo = await cliente.query<{ maxl: string }>(
      `select coalesce(max(length(${col})), 0)::text as maxl from ${ref}`,
    );
    // Un narrativo puede tener pocos valores distintos en un ambiente con poca data
    // y aun así ser texto libre: la longitud lo delata mejor que la cardinalidad.
    const esNarrativo = Number(largo.rows[0].maxl) > 200;

    if (distintos <= ctx.umbralValores && !esNarrativo) {
      const vals = await observados(ctx.umbralValores);
      return {
        ...base,
        tipoDominio: 'VALORES_OBSERVADOS',
        valoresPosibles: vals.map((v) => `${DiccionarioUtils.truncar(v.valor, 80)} (${v.n})`),
        detalle: `${distintos} valores distintos observados. Lista abierta: la base no la restringe.`,
        noNulos,
        distintos,
      };
    }
    const res = await cliente.query<{ minl: string; maxl: string; ejemplo: string }>(
      `select min(length(${col}))::text as minl, max(length(${col}))::text as maxl,
              (select ${col} from ${ref} where ${col} is not null limit 1) as ejemplo
       from ${ref} where ${col} is not null`,
    );
    const { minl, maxl, ejemplo } = res.rows[0];
    return {
      ...base,
      tipoDominio: 'TEXTO_LIBRE',
      valoresPosibles: [],
      detalle: `Texto libre: ${distintos} valores distintos, longitud ${minl}–${maxl}. Ejemplo: "${DiccionarioUtils.truncar(ejemplo ?? '', 90)}"`,
      noNulos,
      distintos,
    };
  }

  const vals = distintos > 0 && distintos <= ctx.umbralValores ? await observados(ctx.umbralValores) : [];
  return {
    ...base,
    tipoDominio: vals.length ? 'VALORES_OBSERVADOS' : 'SIN_DATOS',
    valoresPosibles: vals.map((v) => `${DiccionarioUtils.truncar(v.valor, 80)} (${v.n})`),
    detalle: `Tipo ${tipo}/${udt}.`,
    noNulos,
    distintos,
  };
}

/** Hoja de portada: origen de los datos y cómo interpretar cada tipo de dominio. */
function hojaLeeme(filas: ColumnaDiccionario[], ctx: Contexto, conAuditoria: boolean): WorkSheet {
  const hoy = new Date().toISOString().slice(0, 10);
  const contenido: unknown[][] = [
    ['Diccionario de valores — tablas TR_ (esquema DHI_ESAVI)'],
    [],
    ['Generado el', hoy],
    ['Script', 'scripts/generar-diccionario-datos.ts'],
    [
      'Base consultada',
      `${process.env.NAME_DATABASE}@${process.env.HOST_DATABASE}:${process.env.PORT_DATABASE}`,
    ],
    ['Tablas', new Set(filas.map((f) => f.tabla)).size],
    ['Columnas documentadas', filas.length],
    ['Columnas de auditoría (AUD_*)', conAuditoria ? 'Incluidas' : 'Omitidas (usar --con-auditoria)'],
    ['Umbral de valores observados', ctx.umbralValores],
    [],
    ['Nota', 'Regenerar apuntando a producción para obtener frecuencias reales.'],
    [],
    ['Tipo de dominio', 'Significado', '¿Lista cerrada?'],
    ['ENUM', 'Tipo enumerado de PostgreSQL declarado en la entidad', 'Sí, la base rechaza otros valores'],
    [
      'CATALOGO',
      'FK a TC_CATALOGO_PADRE; el dominio son las subcategorías de una categoría',
      'Sí, pero administrable por datos',
    ],
    [
      'REFERENCIA',
      'FK a otra tabla (parroquia, establecimiento, notificación…)',
      'El dominio es la tabla referenciada',
    ],
    ['BOOLEANO', 'true / false (+ null si es nulable)', 'Sí'],
    [
      'VALORES_OBSERVADOS',
      'Baja cardinalidad: se listan los valores presentes con su frecuencia',
      'No, la base no restringe',
    ],
    ['TEXTO_LIBRE', 'Alta cardinalidad: se reporta rango de longitud y un ejemplo', 'No'],
    ['RANGO_FECHA / RANGO_NUMERICO', 'Rango observado mínimo–máximo', 'No'],
    ['JSON', 'Documento JSON; se listan las claves de primer nivel', 'No'],
    ['SIN_DATOS', 'Sin filas en este ambiente: el dominio no es observable', '—'],
  ];
  return DiccionarioUtils.hoja(contenido, [32, 80, 40]);
}

/**
 * Hoja de columnas con autofiltro.
 * `incluirTabla` distingue la hoja consolidada de las hojas por tabla.
 */
function hojaColumnas(filas: ColumnaDiccionario[], incluirTabla: boolean): WorkSheet {
  const cab = [
    ...(incluirTabla ? ['Tabla'] : []),
    'Columna',
    'Tipo',
    'Nulable',
    'Por defecto',
    'Comentario',
    'Tipo de dominio',
    'Valores posibles',
    'Detalle',
    'Total filas',
    'No nulos',
    '% nulos',
    'Distintos',
  ];
  const anchos = [...(incluirTabla ? [28] : []), 32, 18, 9, 22, 40, 20, 60, 70, 12, 10, 9, 10];
  const contenido: unknown[][] = [cab];
  filas.forEach((f) => {
    contenido.push([
      ...(incluirTabla ? [f.tabla] : []),
      f.columna,
      f.tipo,
      f.nulable ? 'SI' : 'NO',
      f.porDefecto ?? '',
      f.comentario ?? '',
      f.tipoDominio,
      f.valoresPosibles.join(' | '),
      f.detalle,
      f.totalFilas,
      f.noNulos,
      f.totalFilas ? DiccionarioUtils.porcentaje(f.totalFilas - f.noNulos, f.totalFilas) : '—',
      f.distintos ?? '',
    ]);
  });
  const hoja = DiccionarioUtils.hoja(contenido, anchos);
  hoja['!autofilter'] = { ref: utils.encode_range({ s: { r: 0, c: 0 }, e: { r: filas.length, c: cab.length - 1 } }) };
  return hoja;
}

/** Índice: filas por tabla, columnas documentadas y hoja donde está el detalle. */
function hojaTablas(filas: ColumnaDiccionario[], ctx: Contexto, hojaPorTabla: Map<string, string>): WorkSheet {
  const tablas = [...new Set(filas.map((f) => f.tabla))];
  const contenido: unknown[][] = [['Tabla', 'Filas en el ambiente', 'Columnas documentadas', 'Hoja de detalle']];
  tablas.forEach((t) => {
    contenido.push([
      t,
      ctx.filasPorTabla.get(t) ?? 0,
      filas.filter((f) => f.tabla === t).length,
      hojaPorTabla.get(t) ?? '',
    ]);
  });
  return DiccionarioUtils.hoja(contenido, [32, 22, 24, 32]);
}

/** Hoja de catálogos administrables (TC_CATALOGO_PADRE). */
function hojaCatalogos(ctx: Contexto): WorkSheet {
  const contenido: unknown[][] = [['Categoría (padre)', 'Código', 'Nombre', 'Descripción']];
  [...ctx.catalogos.entries()].forEach(([padre, hijos]) => {
    hijos.forEach((h) => contenido.push([padre, h.codigo, h.nombre, h.descripcion ?? '']));
  });
  return DiccionarioUtils.hoja(contenido, [30, 24, 50, 60]);
}

/** Hoja de conteo por tipo de dominio. */
function hojaResumenDominios(filas: ColumnaDiccionario[]): WorkSheet {
  const resumen = filas.reduce<Record<string, number>>((acc, f) => {
    acc[f.tipoDominio] = (acc[f.tipoDominio] ?? 0) + 1;
    return acc;
  }, {});
  const contenido: unknown[][] = [['Tipo de dominio', 'Columnas']];
  Object.entries(resumen)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tipo, n]) => contenido.push([tipo, n]));
  return DiccionarioUtils.hoja(contenido, [28, 12]);
}

function construirLibro(filas: ColumnaDiccionario[], ctx: Contexto, conAuditoria: boolean): WorkBook {
  const tablas = [...new Set(filas.map((f) => f.tabla))];
  const usados = new Set(['Léeme', 'Diccionario', 'Tablas', 'Catálogos', 'Resumen dominios']);
  const hojaPorTabla = new Map(tablas.map((t) => [t, DiccionarioUtils.nombreHoja(t, usados)]));

  const libro = utils.book_new();
  utils.book_append_sheet(libro, hojaLeeme(filas, ctx, conAuditoria), 'Léeme');
  utils.book_append_sheet(libro, hojaTablas(filas, ctx, hojaPorTabla), 'Tablas');
  utils.book_append_sheet(libro, hojaColumnas(filas, true), 'Diccionario');
  tablas.forEach((tabla) => {
    const cols = filas.filter((f) => f.tabla === tabla);
    utils.book_append_sheet(libro, hojaColumnas(cols, false), hojaPorTabla.get(tabla)!);
  });
  utils.book_append_sheet(libro, hojaCatalogos(ctx), 'Catálogos');
  utils.book_append_sheet(libro, hojaResumenDominios(filas), 'Resumen dominios');
  return libro;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const conAuditoria = args.includes('--con-auditoria');
  const umbralArg = args.find((a) => a.startsWith('--umbral='));
  const umbralValores = umbralArg ? Number(umbralArg.split('=')[1]) : 40;

  const cliente = new Client({
    host: process.env.HOST_DATABASE,
    port: Number(process.env.PORT_DATABASE ?? 5432),
    user: process.env.USER_DATABASE,
    password: process.env.PASS_DATABASE,
    database: process.env.NAME_DATABASE,
  });
  await cliente.connect();

  try {
    const ctx = await cargarContexto(cliente, umbralValores);

    const resCols = await cliente.query<{
      tabla: string;
      columna: string;
      tipo: string;
      udt: string;
      nulable: string;
      por_defecto: string | null;
      comentario: string | null;
    }>(
      `
      select c.table_name as tabla, c.column_name as columna, c.data_type as tipo,
             c.udt_name as udt, c.is_nullable as nulable, c.column_default as por_defecto,
             col_description(format('%I.%I', c.table_schema, c.table_name)::regclass, c.ordinal_position) as comentario
      from information_schema.columns c
      where c.table_schema = $1 and c.table_name like 'TR\\_%'
      order by c.table_name, c.ordinal_position
    `,
      [DiccionarioUtils.ESQUEMA],
    );

    const filas: ColumnaDiccionario[] = [];
    for (const meta of resCols.rows) {
      if (!conAuditoria && COLUMNAS_AUDITORIA.includes(meta.columna)) continue;
      filas.push(
        await describirColumna(cliente, ctx, {
          tabla: meta.tabla,
          columna: meta.columna,
          tipo: meta.tipo,
          udt: meta.udt,
          nulable: meta.nulable === 'YES',
          porDefecto: meta.por_defecto,
          comentario: meta.comentario,
        }),
      );
    }

    const salida = path.resolve(__dirname, '..', 'docs');
    fs.mkdirSync(salida, { recursive: true });
    const archivo = path.join(salida, 'diccionario-datos-TR.xlsx');
    writeFile(construirLibro(filas, ctx, conAuditoria), archivo);

    const resumen = filas.reduce<Record<string, number>>((acc, f) => {
      acc[f.tipoDominio] = (acc[f.tipoDominio] ?? 0) + 1;
      return acc;
    }, {});
    console.log(`Diccionario generado: ${filas.length} columnas de ${new Set(filas.map((f) => f.tabla)).size} tablas`);
    console.table(resumen);
    console.log('Archivo: docs/diccionario-datos-TR.xlsx');
  } finally {
    await cliente.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
