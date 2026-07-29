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
