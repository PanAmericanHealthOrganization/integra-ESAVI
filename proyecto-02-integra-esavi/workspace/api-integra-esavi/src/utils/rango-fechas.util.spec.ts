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
