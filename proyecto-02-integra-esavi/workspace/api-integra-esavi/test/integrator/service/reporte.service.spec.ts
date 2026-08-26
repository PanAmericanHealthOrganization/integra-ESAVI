import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ReporteService } from 'src/integrator/service/reporte.service';
import { Paciente } from 'src/integrator/entity/paciente.entity';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock('child_process', () => ({
  ...jest.requireActual('child_process'),
  exec: jest.fn(),
}));

const fs = require('fs');
const { exec } = require('child_process');

const mockPacienteRepo = {
  query: jest.fn(),
};

describe('ReporteService', () => {
  let service: ReporteService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReporteService,
        { provide: getRepositoryToken(Paciente, 'POSTGRES_INTEGRATOR_DS'), useValue: mockPacienteRepo },
      ],
    }).compile();

    service = module.get<ReporteService>(ReporteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createPdf ──────────────────────────────────────────────────────────────

  describe('createPdf', () => {
    it('elimina el pdf previo si existe y ejecuta el comando Quarto exitosamente', async () => {
      fs.existsSync.mockReturnValue(true);
      exec.mockImplementation((command: string, cb: any) => cb(null, 'stdout ok', ''));

      const result = await service.createPdf();

      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(exec).toHaveBeenCalled();
      expect(result).toBe('PDF generado correctamente');
    });

    it('continúa sin eliminar si el pdf previo no existe', async () => {
      fs.existsSync.mockReturnValue(false);
      exec.mockImplementation((command: string, cb: any) => cb(null, 'stdout ok', ''));

      const result = await service.createPdf();

      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(result).toBe('PDF generado correctamente');
    });

    it('lanza BadRequestException si el comando Quarto falla', async () => {
      fs.existsSync.mockReturnValue(false);
      exec.mockImplementation((command: string, cb: any) => cb(new Error('quarto not found'), '', 'error stderr'));

      await expect(service.createPdf()).rejects.toThrow(BadRequestException);
    });
  });

  // ─── retrivePdf ─────────────────────────────────────────────────────────────

  describe('retrivePdf', () => {
    it('genera el pdf y lo retorna en base64', async () => {
      fs.existsSync.mockReturnValue(false);
      exec.mockImplementation((command: string, cb: any) => cb(null, 'ok', ''));
      fs.readFileSync.mockReturnValue(Buffer.from('contenido-pdf'));

      const result = await service.retrivePdf('2024-01-01', '2024-01-31');

      expect(result).toBe(Buffer.from('contenido-pdf').toString('base64'));
    });

    it('lanza BadRequestException si falla la generación del PDF', async () => {
      fs.existsSync.mockReturnValue(false);
      exec.mockImplementation((command: string, cb: any) => cb(new Error('fail'), '', 'err'));

      await expect(service.retrivePdf('2024-01-01', '2024-01-31')).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si falla la lectura del PDF generado', async () => {
      fs.existsSync.mockReturnValue(false);
      exec.mockImplementation((command: string, cb: any) => cb(null, 'ok', ''));
      fs.readFileSync.mockImplementation(() => {
        throw new Error('no se pudo leer');
      });

      await expect(service.retrivePdf('2024-01-01', '2024-01-31')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── consultas nativas ──────────────────────────────────────────────────────

  describe('casosEsaviPorSexoGrave', () => {
    it('retorna los resultados de la consulta', async () => {
      mockPacienteRepo.query.mockResolvedValue([{ sexo: 'HOMBRE', cantidad: '5' }]);
      const result = await service.casosEsaviPorSexoGrave();
      expect(result).toEqual([{ sexo: 'HOMBRE', cantidad: '5' }]);
    });

    it('lanza error si la consulta falla', async () => {
      mockPacienteRepo.query.mockRejectedValue(new Error('db error'));
      await expect(service.casosEsaviPorSexoGrave()).rejects.toThrow('Failed to execute native query: db error');
    });
  });

  describe('casosEsaviPorSexoNoGrave', () => {
    it('retorna los resultados de la consulta', async () => {
      mockPacienteRepo.query.mockResolvedValue([{ sexo: 'MUJER', cantidad: '3' }]);
      const result = await service.casosEsaviPorSexoNoGrave();
      expect(result).toEqual([{ sexo: 'MUJER', cantidad: '3' }]);
    });

    it('lanza error si la consulta falla', async () => {
      mockPacienteRepo.query.mockRejectedValue(new Error('db error'));
      await expect(service.casosEsaviPorSexoNoGrave()).rejects.toThrow('Failed to execute native query: db error');
    });
  });

  describe('casosEsaviPorMes', () => {
    it('retorna los resultados de la consulta', async () => {
      mockPacienteRepo.query.mockResolvedValue([{ aniomes: '202401', cantidad: '10' }]);
      const result = await service.casosEsaviPorMes();
      expect(result).toEqual([{ aniomes: '202401', cantidad: '10' }]);
    });

    it('lanza error si la consulta falla', async () => {
      mockPacienteRepo.query.mockRejectedValue(new Error('db error'));
      await expect(service.casosEsaviPorMes()).rejects.toThrow('Failed to execute native query: db error');
    });
  });

  describe('casosCruzadosMeddra', () => {
    it('retorna los resultados de la consulta', async () => {
      mockPacienteRepo.query.mockResolvedValue([{ total_registros: '100' }]);
      const result = await service.casosCruzadosMeddra();
      expect(result).toEqual([{ total_registros: '100' }]);
    });

    it('lanza error si la consulta falla', async () => {
      mockPacienteRepo.query.mockRejectedValue(new Error('db error'));
      await expect(service.casosCruzadosMeddra()).rejects.toThrow('Failed to execute native query: db error');
    });
  });

  describe('casosNoCruzadosMeddra', () => {
    it('retorna los resultados de la consulta', async () => {
      mockPacienteRepo.query.mockResolvedValue([{ total_registros: '50' }]);
      const result = await service.casosNoCruzadosMeddra();
      expect(result).toEqual([{ total_registros: '50' }]);
    });

    it('lanza error si la consulta falla', async () => {
      mockPacienteRepo.query.mockRejectedValue(new Error('db error'));
      await expect(service.casosNoCruzadosMeddra()).rejects.toThrow('Failed to execute native query: db error');
    });
  });

  describe('casosCruzadosWhodrug', () => {
    it('retorna los resultados de la consulta', async () => {
      mockPacienteRepo.query.mockResolvedValue([{ total_whudrug: '20' }]);
      const result = await service.casosCruzadosWhodrug();
      expect(result).toEqual([{ total_whudrug: '20' }]);
    });

    it('lanza error si la consulta falla', async () => {
      mockPacienteRepo.query.mockRejectedValue(new Error('db error'));
      await expect(service.casosCruzadosWhodrug()).rejects.toThrow('Failed to execute native query: db error');
    });
  });
});
