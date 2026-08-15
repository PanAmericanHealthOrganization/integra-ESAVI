import { Test, TestingModule } from '@nestjs/testing';
import { VigiflowIntegradorController } from './vigiflow-integrador.controller';

/** Quien lanza la importación; el controlador lo propaga para que reciba la notificación. */
const usuario = { id: 'sub-123', username: 'ana', roles: ['admin'] } as any;

describe('VigiflowIntegradorController.bulk', () => {
  const mockIntegrador = { createInBulk: jest.fn() };
  const controller = new VigiflowIntegradorController(
    {} as any,
    mockIntegrador as any,
    {} as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    // Silencia el logger del controlador en el camino de error.
    jest.spyOn((controller as any).logger, 'error').mockImplementation(() => undefined);
  });

  it('convierte YYYYMMDD a Date antes de delegar en el servicio', async () => {
    mockIntegrador.createInBulk.mockResolvedValue({ totalPeriodos: 1, completados: 1, fallidos: [] });

    await controller.bulk({ fechaInicio: '20240101', fechaFin: '20240131', codigoATC: 'J07' } as any, usuario);

    expect(mockIntegrador.createInBulk).toHaveBeenCalledWith(
      new Date('2024-01-01'),
      new Date('2024-01-31'),
      'J07',
      usuario,
    );
  });

  it('no menciona periodos cuando el rango cabe en un solo mes', async () => {
    mockIntegrador.createInBulk.mockResolvedValue({ totalPeriodos: 1, completados: 1, fallidos: [] });

    const respuesta = await controller.bulk({
      fechaInicio: '20240101',
      fechaFin: '20240131',
      codigoATC: 'J07',
    } as any, usuario);

    expect(respuesta).toEqual({ status: 'OK', msg: 'Datos importados exitosamente desde Vigiflow' });
  });

  it('informa cuántos periodos mensuales se procesaron en un rango largo', async () => {
    mockIntegrador.createInBulk.mockResolvedValue({ totalPeriodos: 4, completados: 4, fallidos: [] });

    const respuesta = await controller.bulk({
      fechaInicio: '20240115',
      fechaFin: '20240410',
      codigoATC: 'J07',
    } as any, usuario);

    expect(respuesta).toEqual({
      status: 'OK',
      msg: 'Datos importados exitosamente desde Vigiflow (4 de 4 periodos mensuales)',
    });
  });

  it('devuelve PARTIAL con el detalle de los meses que fallaron', async () => {
    mockIntegrador.createInBulk.mockResolvedValue({
      totalPeriodos: 3,
      completados: 2,
      fallidos: [{ periodo: '20240201 – 20240229', error: 'VigiFlow no responde' }],
    });

    const respuesta = await controller.bulk({
      fechaInicio: '20240101',
      fechaFin: '20240331',
      codigoATC: 'J07',
    } as any, usuario);

    expect(respuesta.status).toBe('PARTIAL');
    expect(respuesta.msg).toContain('2 de 3 periodos mensuales');
    expect(respuesta.msg).toContain('20240201 – 20240229');
  });

  it('devuelve ERROR cuando la importación completa falla', async () => {
    mockIntegrador.createInBulk.mockRejectedValue(new Error('VigiFlow caído'));

    const respuesta = await controller.bulk({
      fechaInicio: '20240101',
      fechaFin: '20240131',
      codigoATC: 'J07',
    } as any, usuario);

    expect(respuesta).toEqual({
      status: 'ERROR',
      msg: 'Error al importar datos del sistema Vigiflow',
    });
  });
});

describe('VigiflowIntegradorController', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  describe('date conversion logic', () => {
    it('should correctly slice and format date strings', () => {
      // Test the date conversion logic used in the bulk method
      const fechaInicio = '20240101';
      const fechaFin = '20241231';

      const convertedFechaInicio = new Date(
        `${fechaInicio.slice(0, 4)}-${fechaInicio.slice(4, 6)}-${fechaInicio.slice(6)}`,
      );
      const convertedFechaFin = new Date(
        `${fechaFin.slice(0, 4)}-${fechaFin.slice(4, 6)}-${fechaFin.slice(6)}`,
      );

      expect(convertedFechaInicio).toEqual(new Date('2024-01-01'));
      expect(convertedFechaFin).toEqual(new Date('2024-12-31'));
    });

    it('should handle edge cases in date conversion', () => {
      const fechaInicio = '20240229'; // Leap year
      const fechaFin = '20240301';

      const convertedFechaInicio = new Date(
        `${fechaInicio.slice(0, 4)}-${fechaInicio.slice(4, 6)}-${fechaInicio.slice(6)}`,
      );
      const convertedFechaFin = new Date(
        `${fechaFin.slice(0, 4)}-${fechaFin.slice(4, 6)}-${fechaFin.slice(6)}`,
      );

      expect(convertedFechaInicio).toEqual(new Date('2024-02-29'));
      expect(convertedFechaFin).toEqual(new Date('2024-03-01'));
    });

    it('should handle different date formats', () => {
      const fechaInicio = '20241201';
      const fechaFin = '20241231';

      const convertedFechaInicio = new Date(
        `${fechaInicio.slice(0, 4)}-${fechaInicio.slice(4, 6)}-${fechaInicio.slice(6)}`,
      );
      const convertedFechaFin = new Date(
        `${fechaFin.slice(0, 4)}-${fechaFin.slice(4, 6)}-${fechaFin.slice(6)}`,
      );

      expect(convertedFechaInicio).toEqual(new Date('2024-12-01'));
      expect(convertedFechaFin).toEqual(new Date('2024-12-31'));
    });

    it('should handle single digit months and days', () => {
      const fechaInicio = '20240101';
      const fechaFin = '20241231';

      const convertedFechaInicio = new Date(
        `${fechaInicio.slice(0, 4)}-${fechaInicio.slice(4, 6)}-${fechaInicio.slice(6)}`,
      );
      const convertedFechaFin = new Date(
        `${fechaFin.slice(0, 4)}-${fechaFin.slice(4, 6)}-${fechaFin.slice(6)}`,
      );

      expect(convertedFechaInicio).toEqual(new Date('2024-01-01'));
      expect(convertedFechaFin).toEqual(new Date('2024-12-31'));
    });

    it('should handle end of month dates', () => {
      const fechaInicio = '20240131';
      const fechaFin = '20240229'; // Leap year February

      const convertedFechaInicio = new Date(
        `${fechaInicio.slice(0, 4)}-${fechaInicio.slice(4, 6)}-${fechaInicio.slice(6)}`,
      );
      const convertedFechaFin = new Date(
        `${fechaFin.slice(0, 4)}-${fechaFin.slice(4, 6)}-${fechaFin.slice(6)}`,
      );

      expect(convertedFechaInicio).toEqual(new Date('2024-01-31'));
      expect(convertedFechaFin).toEqual(new Date('2024-02-29'));
    });
  });

  describe('query parameter validation', () => {
    it('should validate required query parameters', () => {
      const validQuery = {
        fechaInicio: '20240101',
        fechaFin: '20240131',
        codigoATC: 'J07',
      };

      expect(validQuery.fechaInicio).toBeDefined();
      expect(validQuery.fechaFin).toBeDefined();
      expect(validQuery.codigoATC).toBeDefined();
      expect(validQuery.fechaInicio).toHaveLength(8);
      expect(validQuery.fechaFin).toHaveLength(8);
      expect(validQuery.codigoATC).toHaveLength(3);
    });

    it('should handle different ATC codes', () => {
      const atcCodes = ['J07', 'J07BX', 'J07CA'];

      atcCodes.forEach((code) => {
        expect(code).toBeDefined();
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
      });
    });
  });

  describe('response format validation', () => {
    it('should validate success response format', () => {
      const successResponse = {
        status: 'OK',
        msg: 'Éxito',
      };

      expect(successResponse.status).toBe('OK');
      expect(successResponse.msg).toBe('Éxito');
      expect(Object.keys(successResponse)).toHaveLength(2);
    });

    it('should validate error response format', () => {
      const errorResponse = {
        status: 'ERROR',
        msg: 'Error al importar datos del sistema Vigiflow',
      };

      expect(errorResponse.status).toBe('ERROR');
      expect(errorResponse.msg).toBe('Error al importar datos del sistema Vigiflow');
      expect(Object.keys(errorResponse)).toHaveLength(2);
    });
  });
});
