import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GacetaService } from 'src/integrator/service/gaceta.service';
import { Gaceta } from 'src/integrator/entity/gaceta.entity';
import { ESTADO_GACETA } from 'src/integrator/entity/interfaces/gaceta.interface';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  access: jest.fn(),
}));

jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: jest.fn(),
}));

// crearGacetaBasica usa format(...) de date-fns con el locale "es" cargado vía require();
// esa combinación no resuelve correctamente bajo ts-jest en este entorno y es lógica que
// pertenece al util, no al servicio bajo prueba, así que se mockea para aislar GacetaService.
jest.mock('src/integrator/utils/gaceta.uitils', () => ({
  crearGacetaBasica: jest.fn((dto) => ({ ...dto, estado: 'PENDIENTE', titulo: 'Gaceta de prueba' })),
}));

const fsPromises = require('fs/promises');
const { promisify } = require('util');
const { crearGacetaBasica } = require('src/integrator/utils/gaceta.uitils');

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

const mockGacetaRepo = {
  exist: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('GacetaService', () => {
  let service: GacetaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('/base/path');
    mockGacetaRepo.create.mockImplementation((data) => ({ ...data }));
    // Por defecto no ejecutamos el script real de renderizado
    promisify.mockReturnValue(jest.fn().mockResolvedValue({ stdout: 'ok', stderr: '' }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GacetaService,
        { provide: getRepositoryToken(Gaceta, 'POSTGRES_INTEGRATOR_DS'), useValue: mockGacetaRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<GacetaService>(GacetaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── exist ──────────────────────────────────────────────────────────────────

  describe('exist', () => {
    it('valida el uuid y consulta el repositorio', async () => {
      mockGacetaRepo.exist.mockResolvedValue(true);
      const result = await service.exist(VALID_UUID);
      expect(result).toBe(true);
      expect(mockGacetaRepo.exist).toHaveBeenCalledWith({ where: { id: VALID_UUID } });
    });

    it('lanza BadRequestException con un uuid inválido', () => {
      // validateAndCleanId lanza de forma síncrona antes de retornar la promesa
      expect(() => service.exist('no-es-un-uuid')).toThrow(BadRequestException);
    });
  });

  // ─── getOne ─────────────────────────────────────────────────────────────────

  describe('getOne', () => {
    it('retorna la gaceta con los gráficos en base64', async () => {
      mockGacetaRepo.findOne.mockResolvedValue({ id: VALID_UUID, hasta: new Date('2024-05-15') });
      fsPromises.readFile.mockResolvedValue(Buffer.from('imagen'));

      const result = await service.getOne(VALID_UUID);

      expect(result.graficoAnalisisPorGravedad).toContain('data:image/png;base64,');
      expect(fsPromises.readFile).toHaveBeenCalledTimes(3);
    });

    it('lanza NotFoundException si no puede leer el archivo del gráfico', async () => {
      mockGacetaRepo.findOne.mockResolvedValue({ id: VALID_UUID, hasta: new Date('2024-05-15') });
      fsPromises.readFile.mockRejectedValue(new Error('no existe'));

      await expect(service.getOne(VALID_UUID)).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si el id es inválido', async () => {
      await expect(service.getOne('invalido')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getMany ────────────────────────────────────────────────────────────────

  describe('getMany', () => {
    it('valida cada id y retorna las gacetas encontradas', async () => {
      mockGacetaRepo.find.mockResolvedValue([{ id: VALID_UUID }]);
      const result = await service.getMany({ ids: [VALID_UUID] } as any);
      expect(result).toEqual([{ id: VALID_UUID }]);
    });

    it('lanza BadRequestException si algún id no es válido', async () => {
      await expect(service.getMany({ ids: [VALID_UUID, 'malo'] } as any)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getPaginated ───────────────────────────────────────────────────────────

  describe('getPaginated', () => {
    it('retorna datos paginados sin filtros', async () => {
      mockGacetaRepo.findAndCount.mockResolvedValue([[{ id: VALID_UUID }], 1]);

      const result = await service.getPaginated({
        pagination: { page: 1, perPage: 10 },
      } as any);

      expect(result).toEqual({ data: [{ id: VALID_UUID }], total: 1 });
    });

    it('aplica filtros de numeroGaceta, estado, autor y ordenamiento personalizado', async () => {
      mockGacetaRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getPaginated({
        pagination: { page: 2, perPage: 5 },
        sort: { field: 'numeroGaceta', order: 'ASC' },
        filter: { numeroGaceta: 3, estado: 'PUBLICADO', autor: 'Juan', volumen: 1, autorSecundario: 'Ana' },
      } as any);

      const callArg = mockGacetaRepo.findAndCount.mock.calls[0][0];
      expect(callArg.skip).toBe(5);
      expect(callArg.take).toBe(5);
      expect(callArg.order).toEqual({ numeroGaceta: 'ASC' });
    });

    it('ignora campo de ordenamiento inválido y usa fechaPublicacion por defecto', async () => {
      mockGacetaRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getPaginated({
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'campoInventado', order: 'ASC' },
      } as any);

      const callArg = mockGacetaRepo.findAndCount.mock.calls[0][0];
      expect(callArg.order).toEqual({ fechaPublicacion: 'ASC' });
    });

    it('aplica filtro de fecha de publicación solo con año', async () => {
      mockGacetaRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.getPaginated({
        pagination: { page: 1, perPage: 10 },
        filter: { fechaPublicacion: '2024' },
      } as any);
      expect(mockGacetaRepo.findAndCount).toHaveBeenCalled();
    });

    it('aplica filtro de fecha de publicación con año-mes', async () => {
      mockGacetaRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.getPaginated({
        pagination: { page: 1, perPage: 10 },
        filter: { fechaPublicacion: '2024-05' },
      } as any);
      expect(mockGacetaRepo.findAndCount).toHaveBeenCalled();
    });

    it('aplica filtro de fecha de publicación completa', async () => {
      mockGacetaRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.getPaginated({
        pagination: { page: 1, perPage: 10 },
        filter: { fechaPublicacion: '2024-05-15' },
      } as any);
      expect(mockGacetaRepo.findAndCount).toHaveBeenCalled();
    });

    it('aplica rango de fechaPublicacionDesde/Hasta', async () => {
      mockGacetaRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.getPaginated({
        pagination: { page: 1, perPage: 10 },
        filter: { fechaPublicacionDesde: '2024-01-01', fechaPublicacionHasta: '2024-12-31' },
      } as any);
      expect(mockGacetaRepo.findAndCount).toHaveBeenCalled();
    });

    it('aplica filtro combinado de anio y mes', async () => {
      mockGacetaRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.getPaginated({
        pagination: { page: 1, perPage: 10 },
        filter: { anio: 2024, mes: 5 },
      } as any);
      expect(mockGacetaRepo.findAndCount).toHaveBeenCalled();
    });
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retorna todas las gacetas ordenadas por fechaPublicacion desc', async () => {
      mockGacetaRepo.find.mockResolvedValue([{ id: VALID_UUID }]);
      const result = await service.findAll();
      expect(mockGacetaRepo.find).toHaveBeenCalledWith({ order: { fechaPublicacion: 'DESC' } });
      expect(result).toEqual([{ id: VALID_UUID }]);
    });
  });

  // ─── create / createGacetaFromBasic ────────────────────────────────────────

  describe('create', () => {
    it('crea una gaceta nueva cuando no hay conflicto de número/periodo', async () => {
      mockGacetaRepo.findOne.mockResolvedValue(null);
      mockGacetaRepo.save.mockResolvedValue({ id: VALID_UUID });

      const result = await service.create({
        desde: new Date('2024-01-01'),
        hasta: new Date('2024-01-31'),
        numeroGaceta: 1,
      } as any);

      expect(mockGacetaRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: VALID_UUID });
    });

    it('lanza error si ya existe una gaceta con el mismo número en el mismo periodo', async () => {
      mockGacetaRepo.findOne.mockResolvedValue({ id: 'otra-gaceta' });

      await expect(
        service.create({ desde: new Date('2024-01-01'), hasta: new Date('2024-01-31'), numeroGaceta: 1 } as any),
      ).rejects.toThrow(/Ya existe una gaceta con el número/);
    });

    it('createGacetaFromBasic arma el DTO básico (vía crearGacetaBasica) y delega en create', async () => {
      mockGacetaRepo.findOne.mockResolvedValue(null);
      mockGacetaRepo.save.mockResolvedValue({ id: VALID_UUID });

      const dto = { desde: new Date('2024-01-01'), hasta: new Date('2024-01-31'), numeroGaceta: 7 };
      const result = await service.createGacetaFromBasic(dto as any);

      expect(crearGacetaBasica).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: VALID_UUID });
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('actualiza la gaceta cuando existe y no hay conflicto', async () => {
      const gacetaExistente = { id: VALID_UUID, desde: new Date('2024-01-01'), hasta: new Date('2024-01-31') };
      // getOne() se invoca dos veces (verificación inicial y retorno final) y hay una
      // verificación adicional de conflicto: todas resuelven al mismo registro (mismo id).
      mockGacetaRepo.findOne.mockResolvedValue(gacetaExistente);
      fsPromises.readFile.mockResolvedValue(Buffer.from('img'));
      mockGacetaRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(VALID_UUID, { volumen: 2 } as any);

      expect(mockGacetaRepo.update).toHaveBeenCalledWith(VALID_UUID, { volumen: 2 });
      expect(result).toBeDefined();
    });

    it('propaga el error cuando el registro no existe (getOne falla al no encontrar la gaceta)', async () => {
      // getOne() no maneja el caso findOne() => null: intenta leer el gráfico
      // sobre un registro inexistente y falla antes de llegar a la validación de "no existe".
      mockGacetaRepo.findOne.mockResolvedValue(null);
      await expect(service.update(VALID_UUID, {} as any)).rejects.toThrow();
    });
  });

  // ─── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('marca la gaceta como CANCELADO (soft delete)', async () => {
      mockGacetaRepo.findOne
        .mockResolvedValueOnce({ id: VALID_UUID, hasta: new Date('2024-01-31') })
        .mockResolvedValueOnce({ id: VALID_UUID, estado: ESTADO_GACETA.CANCELADO });
      fsPromises.readFile.mockResolvedValue(Buffer.from('img'));
      mockGacetaRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.delete(VALID_UUID, { deletedBy: 'admin' } as any);

      expect(mockGacetaRepo.update).toHaveBeenCalledWith(
        VALID_UUID,
        expect.objectContaining({ estado: ESTADO_GACETA.CANCELADO, deletedBy: 'admin' }),
      );
      expect(result.estado).toBe(ESTADO_GACETA.CANCELADO);
    });

    it('propaga el error cuando el registro no existe (getOne falla al no encontrar la gaceta)', async () => {
      mockGacetaRepo.findOne.mockResolvedValue(null);
      await expect(service.delete(VALID_UUID, {} as any)).rejects.toThrow();
    });
  });

  // ─── findByPeriodo / findByEstado ───────────────────────────────────────────

  describe('findByPeriodo', () => {
    it('filtra solo por año cuando no se especifica mes', async () => {
      mockGacetaRepo.find.mockResolvedValue([]);
      await service.findByPeriodo(2024);
      expect(mockGacetaRepo.find).toHaveBeenCalledWith({
        where: { anio: 2024 },
        order: { numeroGaceta: 'ASC' },
      });
    });

    it('filtra por año y mes cuando se especifica mes', async () => {
      mockGacetaRepo.find.mockResolvedValue([]);
      await service.findByPeriodo(2024, 5);
      expect(mockGacetaRepo.find).toHaveBeenCalledWith({
        where: { anio: 2024, mes: 5 },
        order: { numeroGaceta: 'ASC' },
      });
    });
  });

  describe('findByEstado', () => {
    it('filtra gacetas por estado', async () => {
      mockGacetaRepo.find.mockResolvedValue([{ id: VALID_UUID }]);
      const result = await service.findByEstado(ESTADO_GACETA.PUBLICADO);
      expect(result).toEqual([{ id: VALID_UUID }]);
    });
  });

  // ─── getPdfInforme ──────────────────────────────────────────────────────────

  describe('getPdfInforme', () => {
    it('retorna el buffer del pdf cuando el archivo existe', async () => {
      fsPromises.access.mockResolvedValue(undefined);
      fsPromises.readFile.mockResolvedValue(Buffer.from('pdf-content'));

      const result = await service.getPdfInforme(2025, 1);

      expect(result).toEqual(Buffer.from('pdf-content'));
    });

    it('lanza NotFoundException si el archivo no existe', async () => {
      fsPromises.access.mockRejectedValue(new Error('no existe'));

      await expect(service.getPdfInforme(2025, 1)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── ejecutarRenderScript ───────────────────────────────────────────────────

  describe('ejecutarRenderScript', () => {
    it('ejecuta el comando y retorna el stdout', async () => {
      const execAsync = jest.fn().mockResolvedValue({ stdout: 'render ok', stderr: '' });
      promisify.mockReturnValue(execAsync);

      const result = await service.ejecutarRenderScript(new Date('2024-01-01'), new Date('2024-01-31'));

      expect(result).toBe('render ok');
      expect(execAsync).toHaveBeenCalled();
    });

    it('registra advertencia si hay stderr no vacío', async () => {
      const execAsync = jest.fn().mockResolvedValue({ stdout: 'ok', stderr: 'warning: algo' });
      promisify.mockReturnValue(execAsync);

      const result = await service.ejecutarRenderScript(new Date('2024-01-01'), new Date('2024-01-31'));

      expect(result).toBe('ok');
    });

    it('lanza BadRequestException con código de error cuando el comando falla', async () => {
      const execAsync = jest.fn().mockRejectedValue(Object.assign(new Error('fallo'), { code: 127 }));
      promisify.mockReturnValue(execAsync);

      await expect(
        service.ejecutarRenderScript(new Date('2024-01-01'), new Date('2024-01-31')),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException genérica cuando el error no tiene código', async () => {
      const execAsync = jest.fn().mockRejectedValue(new Error('fallo sin codigo'));
      promisify.mockReturnValue(execAsync);

      await expect(
        service.ejecutarRenderScript(new Date('2024-01-01'), new Date('2024-01-31')),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
