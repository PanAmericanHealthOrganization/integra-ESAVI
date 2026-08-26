import { Test, TestingModule } from '@nestjs/testing';

// El guard real (KeycloakAuthGuard) importa `jwks-rsa`, que a su vez depende de `jose`
// (paquete ESM-only) que ts-jest/Jest no puede transformar sin tocar la config de Jest.
// Como en pruebas unitarias los guards nunca se ejecutan (llamamos los métodos del
// controller directamente, sin pasar por el pipeline HTTP de Nest), se reemplaza el
// módulo del guard por un doble simple para evitar cargar la dependencia real.
jest.mock('src/common/guards/keycloak-auth.guard', () => ({
  KeycloakAuthGuard: jest.fn().mockImplementation(() => ({ canActivate: () => true })),
}));

import { ReporteController } from 'src/integrator/controller/reporte.controller';
import { ReporteService } from 'src/integrator/service/reporte.service';

const mockReporteService = {
  createPdf: jest.fn(),
  retrivePdf: jest.fn(),
  casosEsaviPorSexoGrave: jest.fn(),
  casosEsaviPorSexoNoGrave: jest.fn(),
  casosEsaviPorMes: jest.fn(),
  casosCruzadosMeddra: jest.fn(),
  casosNoCruzadosMeddra: jest.fn(),
  casosCruzadosWhodrug: jest.fn(),
};

describe('ReporteController', () => {
  let controller: ReporteController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReporteController],
      providers: [{ provide: ReporteService, useValue: mockReporteService }],
    }).compile();
    controller = module.get<ReporteController>(ReporteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPdf', () => {
    it('envuelve la respuesta del servicio en { msg, data }', async () => {
      mockReporteService.createPdf.mockResolvedValue({ url: 'file.pdf' });
      const result = await controller.createPdf();
      expect(mockReporteService.createPdf).toHaveBeenCalled();
      expect(result).toEqual({ msg: 'OK', data: { url: 'file.pdf' } });
    });
  });

  describe('retrivePdf', () => {
    it('retorna error si faltan las fechas', async () => {
      const result = await controller.retrivePdf({});
      expect(result).toEqual({
        msg: 'Error',
        error: 'Both fechaInicio and fechaFin are required.',
      });
      expect(mockReporteService.retrivePdf).not.toHaveBeenCalled();
    });

    it('retorna error si el formato de fecha es inválido', async () => {
      const result = await controller.retrivePdf({ startDate: '10-01-2021', endDate: '2021-01-31' });
      expect(result.msg).toBe('Error');
      expect(result.error).toContain('Invalid date format');
      expect(mockReporteService.retrivePdf).not.toHaveBeenCalled();
    });

    it('retorna error si la fecha no es válida (NaN) aunque el formato calce con el regex', async () => {
      const result = await controller.retrivePdf({ startDate: '2021-13-01', endDate: '2021-03-01' });
      expect(result).toEqual({
        msg: 'Error',
        error: 'Invalid date format. Please check your dates.',
      });
      expect(mockReporteService.retrivePdf).not.toHaveBeenCalled();
    });

    it('retorna error si fechaInicio es mayor que fechaFin', async () => {
      const result = await controller.retrivePdf({ startDate: '2021-12-31', endDate: '2021-01-01' });
      expect(result).toEqual({
        msg: 'Error',
        error: 'fechaInicio cannot be later than fechaFin.',
      });
      expect(mockReporteService.retrivePdf).not.toHaveBeenCalled();
    });

    it('delega en el servicio cuando las fechas son válidas', async () => {
      mockReporteService.retrivePdf.mockResolvedValue({ url: 'reporte.pdf' });

      const result = await controller.retrivePdf({ startDate: '2021-01-01', endDate: '2021-01-31' });

      expect(mockReporteService.retrivePdf).toHaveBeenCalledWith(
        new Date('2021-01-01'),
        new Date('2021-01-31'),
      );
      expect(result).toEqual({ msg: 'OK', data: { url: 'reporte.pdf' } });
    });
  });

  describe('casosEsaviPorSexoGrave', () => {
    it('delega en el servicio y envuelve la respuesta', async () => {
      mockReporteService.casosEsaviPorSexoGrave.mockResolvedValue([{ sexo: 'M', total: 1 }]);
      const result = await controller.casosEsaviPorSexoGrave();
      expect(result).toEqual({ msg: 'OK', data: [{ sexo: 'M', total: 1 }] });
    });
  });

  describe('casosEsaviPorSexoNoGrave', () => {
    it('delega en el servicio y envuelve la respuesta', async () => {
      mockReporteService.casosEsaviPorSexoNoGrave.mockResolvedValue([{ sexo: 'F', total: 2 }]);
      const result = await controller.casosEsaviPorSexoNoGrave();
      expect(result).toEqual({ msg: 'OK', data: [{ sexo: 'F', total: 2 }] });
    });
  });

  describe('casosEsaviPorMes', () => {
    it('delega en el servicio y envuelve la respuesta', async () => {
      mockReporteService.casosEsaviPorMes.mockResolvedValue([{ mes: 1, total: 3 }]);
      const result = await controller.casosEsaviPorMes();
      expect(result).toEqual({ msg: 'OK', data: [{ mes: 1, total: 3 }] });
    });
  });

  describe('casosCruzadosMeddra', () => {
    it('delega en el servicio y envuelve la respuesta', async () => {
      mockReporteService.casosCruzadosMeddra.mockResolvedValue([{ id: 'c1' }]);
      const result = await controller.casosCruzadosMeddra();
      expect(result).toEqual({ msg: 'OK', data: [{ id: 'c1' }] });
    });
  });

  describe('casosNoCruzadosMeddra', () => {
    it('delega en el servicio y envuelve la respuesta', async () => {
      mockReporteService.casosNoCruzadosMeddra.mockResolvedValue([{ id: 'c2' }]);
      const result = await controller.casosNoCruzadosMeddra();
      expect(result).toEqual({ msg: 'OK', data: [{ id: 'c2' }] });
    });
  });

  describe('casosCruzadosWhodrug', () => {
    it('delega en el servicio y envuelve la respuesta', async () => {
      mockReporteService.casosCruzadosWhodrug.mockResolvedValue([{ id: 'c3' }]);
      const result = await controller.casosCruzadosWhodrug();
      expect(result).toEqual({ msg: 'OK', data: [{ id: 'c3' }] });
    });
  });
});
