import { RangoFechasUtils } from './rango-fechas.util';

describe('RangoFechasUtils.diaAnterior', () => {
  it('devuelve el día anterior completo en UTC (00:00:00.000 a 23:59:59.999)', () => {
    const { fechaInicio, fechaFin } = RangoFechasUtils.diaAnterior(new Date('2026-07-28T23:00:00.000Z'));

    expect(fechaInicio.toISOString()).toBe('2026-07-27T00:00:00.000Z');
    expect(fechaFin.toISOString()).toBe('2026-07-27T23:59:59.999Z');
  });

  it('retrocede al último día del mes anterior cuando la referencia es el día 1', () => {
    const { fechaInicio, fechaFin } = RangoFechasUtils.diaAnterior(new Date('2026-03-01T23:30:00.000Z'));

    expect(fechaInicio.toISOString()).toBe('2026-02-28T00:00:00.000Z');
    expect(fechaFin.toISOString()).toBe('2026-02-28T23:59:59.999Z');
  });

  it('resuelve el 29 de febrero en año bisiesto', () => {
    const { fechaInicio } = RangoFechasUtils.diaAnterior(new Date('2024-03-01T23:00:00.000Z'));

    expect(fechaInicio.toISOString()).toBe('2024-02-29T00:00:00.000Z');
  });

  it('retrocede al 31 de diciembre del año anterior en el cambio de año', () => {
    const { fechaInicio, fechaFin } = RangoFechasUtils.diaAnterior(new Date('2026-01-01T23:00:00.000Z'));

    expect(fechaInicio.toISOString()).toBe('2025-12-31T00:00:00.000Z');
    expect(fechaFin.toISOString()).toBe('2025-12-31T23:59:59.999Z');
  });

  it('el rango siempre cubre un único día (fechaFin > fechaInicio)', () => {
    const { fechaInicio, fechaFin } = RangoFechasUtils.diaAnterior(new Date('2026-07-28T23:00:00.000Z'));

    expect(fechaFin.getTime()).toBeGreaterThan(fechaInicio.getTime());
    expect(fechaFin.getTime() - fechaInicio.getTime()).toBe(86_399_999);
  });
});

describe('RangoFechasUtils.dividirEnMeses', () => {
  const aIso = (rangos: { fechaInicio: Date; fechaFin: Date }[]) =>
    rangos.map((r) => [r.fechaInicio.toISOString(), r.fechaFin.toISOString()]);

  it('devuelve un único tramo cuando el rango cabe en un mes', () => {
    const rangos = RangoFechasUtils.dividirEnMeses(
      new Date('2026-03-05T00:00:00.000Z'),
      new Date('2026-03-20T00:00:00.000Z'),
    );

    expect(aIso(rangos)).toEqual([['2026-03-05T00:00:00.000Z', '2026-03-20T00:00:00.000Z']]);
  });

  it('parte el rango por mes calendario respetando los extremos originales', () => {
    const rangos = RangoFechasUtils.dividirEnMeses(
      new Date('2026-01-15T00:00:00.000Z'),
      new Date('2026-04-10T00:00:00.000Z'),
    );

    expect(aIso(rangos)).toEqual([
      ['2026-01-15T00:00:00.000Z', '2026-01-31T23:59:59.999Z'],
      ['2026-02-01T00:00:00.000Z', '2026-02-28T23:59:59.999Z'],
      ['2026-03-01T00:00:00.000Z', '2026-03-31T23:59:59.999Z'],
      ['2026-04-01T00:00:00.000Z', '2026-04-10T00:00:00.000Z'],
    ]);
  });

  it('resuelve el 29 de febrero en año bisiesto', () => {
    const rangos = RangoFechasUtils.dividirEnMeses(
      new Date('2024-02-01T00:00:00.000Z'),
      new Date('2024-03-15T00:00:00.000Z'),
    );

    expect(aIso(rangos)).toEqual([
      ['2024-02-01T00:00:00.000Z', '2024-02-29T23:59:59.999Z'],
      ['2024-03-01T00:00:00.000Z', '2024-03-15T00:00:00.000Z'],
    ]);
  });

  it('cruza el cambio de año', () => {
    const rangos = RangoFechasUtils.dividirEnMeses(
      new Date('2025-12-20T00:00:00.000Z'),
      new Date('2026-01-05T00:00:00.000Z'),
    );

    expect(aIso(rangos)).toEqual([
      ['2025-12-20T00:00:00.000Z', '2025-12-31T23:59:59.999Z'],
      ['2026-01-01T00:00:00.000Z', '2026-01-05T00:00:00.000Z'],
    ]);
  });

  it('un rango que termina justo el último día del mes no genera un tramo vacío al mes siguiente', () => {
    const rangos = RangoFechasUtils.dividirEnMeses(
      new Date('2026-05-01T00:00:00.000Z'),
      new Date('2026-05-31T23:59:59.999Z'),
    );

    expect(rangos).toHaveLength(1);
    expect(aIso(rangos)).toEqual([['2026-05-01T00:00:00.000Z', '2026-05-31T23:59:59.999Z']]);
  });

  it('los tramos son contiguos y cubren el rango completo sin solaparse', () => {
    const inicio = new Date('2026-01-15T00:00:00.000Z');
    const fin = new Date('2026-06-10T00:00:00.000Z');
    const rangos = RangoFechasUtils.dividirEnMeses(inicio, fin);

    expect(rangos[0].fechaInicio).toEqual(inicio);
    expect(rangos[rangos.length - 1].fechaFin).toEqual(fin);
    for (let i = 1; i < rangos.length; i++) {
      expect(rangos[i].fechaInicio.getTime() - rangos[i - 1].fechaFin.getTime()).toBe(1);
    }
  });

  it('devuelve el rango intacto si viene invertido: validarlo es del llamador', () => {
    const inicio = new Date('2026-05-10T00:00:00.000Z');
    const fin = new Date('2026-01-10T00:00:00.000Z');

    expect(RangoFechasUtils.dividirEnMeses(inicio, fin)).toEqual([{ fechaInicio: inicio, fechaFin: fin }]);
  });
});

describe('RangoFechasUtils.parsearFechaLocal', () => {
  it('interpreta YYYY-MM-DD como medianoche local, no UTC', () => {
    const fecha = RangoFechasUtils.parsearFechaLocal('2026-08-01')!;

    expect(fecha.getFullYear()).toBe(2026);
    expect(fecha.getMonth()).toBe(7);
    expect(fecha.getDate()).toBe(1);
    expect(fecha.getHours()).toBe(0);
    expect(fecha.getMinutes()).toBe(0);
  });

  it('acepta el 29 de febrero de un año bisiesto', () => {
    expect(RangoFechasUtils.parsearFechaLocal('2024-02-29')?.getDate()).toBe(29);
  });

  it('rechaza una fecha que no existe en el calendario', () => {
    expect(RangoFechasUtils.parsearFechaLocal('2026-02-30')).toBeNull();
    expect(RangoFechasUtils.parsearFechaLocal('2026-13-01')).toBeNull();
  });

  it('rechaza formatos distintos de YYYY-MM-DD y valores vacíos', () => {
    expect(RangoFechasUtils.parsearFechaLocal('01/08/2026')).toBeNull();
    expect(RangoFechasUtils.parsearFechaLocal('2026-8-1')).toBeNull();
    expect(RangoFechasUtils.parsearFechaLocal('2026-08-01T00:00:00Z')).toBeNull();
    expect(RangoFechasUtils.parsearFechaLocal('')).toBeNull();
    expect(RangoFechasUtils.parsearFechaLocal(undefined)).toBeNull();
  });
});

describe('RangoFechasUtils.enumerarDiasLocales', () => {
  const dia = (valor: string) => RangoFechasUtils.parsearFechaLocal(valor)!;
  const aIsoLocal = (fechas: Date[]) =>
    fechas.map((f) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`);

  it('incluye ambos extremos del rango', () => {
    const dias = RangoFechasUtils.enumerarDiasLocales(dia('2026-08-01'), dia('2026-08-04'));

    expect(aIsoLocal(dias)).toEqual(['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04']);
  });

  it('un rango de un solo día devuelve ese día', () => {
    expect(aIsoLocal(RangoFechasUtils.enumerarDiasLocales(dia('2026-08-01'), dia('2026-08-01')))).toEqual([
      '2026-08-01',
    ]);
  });

  it('cruza el cambio de mes y de año sin saltarse días', () => {
    expect(aIsoLocal(RangoFechasUtils.enumerarDiasLocales(dia('2026-12-30'), dia('2027-01-02')))).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ]);
  });

  it('resuelve el 29 de febrero en año bisiesto', () => {
    expect(aIsoLocal(RangoFechasUtils.enumerarDiasLocales(dia('2024-02-28'), dia('2024-03-01')))).toEqual([
      '2024-02-28',
      '2024-02-29',
      '2024-03-01',
    ]);
  });

  it('todos los días quedan a medianoche local', () => {
    const dias = RangoFechasUtils.enumerarDiasLocales(dia('2026-08-01'), dia('2026-08-03'));

    expect(dias.every((f) => f.getHours() === 0 && f.getMinutes() === 0 && f.getSeconds() === 0)).toBe(true);
  });

  it('devuelve un arreglo vacío si el rango viene invertido', () => {
    expect(RangoFechasUtils.enumerarDiasLocales(dia('2026-08-10'), dia('2026-08-01'))).toEqual([]);
  });
});
