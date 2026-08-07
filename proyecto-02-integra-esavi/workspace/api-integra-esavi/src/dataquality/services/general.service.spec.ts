import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { GeneralService } from './general.service';
import { DimConsistenciaService } from './dim-consitencia';
import { DimExactitudService } from './dim-exactitud.service';
import { DimCompletitudService } from './dim-completitud.service';
import { DataQualityDimensions } from '../entities/dataQualityDimensions.entity';
import { DIMENSION_CALIDAD } from '../controllers/dto';

const mockDataSource = {
  query: jest.fn(),
};

const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockDimConsistenciaService = {
  processAll: jest.fn(),
};

const mockDimExactitudService = {
  processAll: jest.fn(),
};

const mockDimCompletitudService = {
  processAll: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const makeDimension = (dimension: DIMENSION_CALIDAD) => ({
  dimension,
  calidadTotal: 100,
  deltaCalidadTotal: 0,
  jsonDimensionQuality: [
    {
      codigo: `${dimension}_001`,
      subDimension: 'Dominio',
      regla: 'regla',
      condicion: 'condicion',
      descripcionRegla: 'descripcion',
      totalRegistros: 10,
      totalRegistrosValidos: 10,
      totalRegistrosInvalidos: 0,
      porcentajeRegistrosValidos: 100,
      porcentajeRegistrosInvalidos: 0,
      idNotificacionesNoValidos: [],
    },
  ],
});

describe('GeneralService', () => {
  let service: GeneralService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeneralService,
        { provide: getDataSourceToken('DATAQUALITY_DS'), useValue: mockDataSource },
        { provide: getRepositoryToken(DataQualityDimensions, 'DATAQUALITY_DS'), useValue: mockRepository },
        { provide: DimConsistenciaService, useValue: mockDimConsistenciaService },
        { provide: DimExactitudService, useValue: mockDimExactitudService },
        { provide: DimCompletitudService, useValue: mockDimCompletitudService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<GeneralService>(GeneralService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── generateQualitySumary ─────────────────────────────────────────────

  describe('generateQualitySumary', () => {
    it('combina las 3 dimensiones de calidad en un único resumen', async () => {
      mockDimExactitudService.processAll.mockResolvedValue(makeDimension(DIMENSION_CALIDAD.EXACTITUD));
      mockDimConsistenciaService.processAll.mockResolvedValue(makeDimension(DIMENSION_CALIDAD.CONSISTENCIA));
      mockDimCompletitudService.processAll.mockResolvedValue(makeDimension(DIMENSION_CALIDAD.COMPLETITUD));

      const day = new Date('2026-07-15T00:00:00.000Z');
      const result = await service.generateQualitySumary(day);

      expect(result.anio).toBe(2026);
      expect(result.mes).toBe(7);
      expect(result.jsonQuality).toHaveLength(3);
      expect(mockDimExactitudService.processAll).toHaveBeenCalledWith(day);
      expect(mockDimConsistenciaService.processAll).toHaveBeenCalledWith(day);
      expect(mockDimCompletitudService.processAll).toHaveBeenCalledWith(day);
    });
  });

  // ─── processQualityDay ──────────────────────────────────────────────────

  describe('processQualityDay', () => {
    beforeEach(() => {
      mockDimExactitudService.processAll.mockResolvedValue(makeDimension(DIMENSION_CALIDAD.EXACTITUD));
      mockDimConsistenciaService.processAll.mockResolvedValue(makeDimension(DIMENSION_CALIDAD.CONSISTENCIA));
      mockDimCompletitudService.processAll.mockResolvedValue(makeDimension(DIMENSION_CALIDAD.COMPLETITUD));
      mockConfigService.get.mockReturnValue('SYSTEM');
    });

    it('crea un nuevo registro cuando no existe uno para el año/mes', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({ id: 1 });

      const day = new Date('2026-07-15T00:00:00.000Z');
      await service.processQualityDay(day);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedArg = mockRepository.save.mock.calls[0][0];
      expect(savedArg.anio).toBe(2026);
      expect(savedArg.mes).toBe(7);
      expect(savedArg.isActive).toBe(true);
    });

    it('actualiza el registro existente cuando ya hay uno para el año/mes', async () => {
      const existing = { id: 1, anio: 2026, mes: 7, jsonQuality: '[]' };
      mockRepository.findOne.mockResolvedValue(existing);
      mockRepository.save.mockResolvedValue(existing);

      const day = new Date('2026-07-15T00:00:00.000Z');
      await service.processQualityDay(day);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedArg = mockRepository.save.mock.calls[0][0];
      expect(savedArg).toBe(existing);
      expect(savedArg.updatedAt).toBeInstanceOf(Date);
    });
  });

  // ─── getGeneralQuality ──────────────────────────────────────────────────

  describe('getGeneralQuality', () => {
    it('retorna null cuando no existe información y no se pudo procesar (queda null tras processQualityDay)', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockDimExactitudService.processAll.mockResolvedValue(makeDimension(DIMENSION_CALIDAD.EXACTITUD));
      mockDimConsistenciaService.processAll.mockResolvedValue(makeDimension(DIMENSION_CALIDAD.CONSISTENCIA));
      mockDimCompletitudService.processAll.mockResolvedValue(makeDimension(DIMENSION_CALIDAD.COMPLETITUD));
      mockRepository.save.mockResolvedValue({ id: 1 });

      const day = new Date('2026-07-15T00:00:00.000Z');
      const result = await service.getGeneralQuality(day);

      expect(result).toBeNull();
      // primer findOne (no existe) + processQualityDay -> findOne interno + segundo findOne tras procesar
      expect(mockRepository.findOne).toHaveBeenCalled();
    });

    it('retorna el registro existente con jsonQuality parseado', async () => {
      const record = { id: 1, anio: 2026, mes: 7, jsonQuality: JSON.stringify([{ a: 1 }]) };
      mockRepository.findOne.mockResolvedValue(record);

      const day = new Date('2026-07-15T00:00:00.000Z');
      const result = await service.getGeneralQuality(day);

      expect(result.jsonQuality).toEqual([{ a: 1 }]);
      expect(mockDimExactitudService.processAll).not.toHaveBeenCalled();
    });
  });

  // ─── qualityProblems ────────────────────────────────────────────────────

  describe('qualityProblems', () => {
    it('lanza error si no se encuentran datos de calidad para el año/mes', async () => {
      mockRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      await expect(service.qualityProblems(2026, 7, 'COD_1')).rejects.toThrow(
        'No se encontraron datos de calidad para año 2026 y mes 7',
      );
    });

    it('lanza error si no se encuentra la regla con el código solicitado', async () => {
      const jsonQuality = [makeDimension(DIMENSION_CALIDAD.EXACTITUD)];
      mockRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ jsonQuality: JSON.stringify(jsonQuality) }),
      });

      await expect(service.qualityProblems(2026, 7, 'NO_EXISTE')).rejects.toThrow(
        'No se encontró la regla de calidad con código: NO_EXISTE',
      );
    });

    it('retorna arreglo vacío cuando la regla no tiene ids de notificaciones no válidas', async () => {
      const jsonQuality = [makeDimension(DIMENSION_CALIDAD.EXACTITUD)];
      jsonQuality[0].jsonDimensionQuality[0].idNotificacionesNoValidos = [];
      mockRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ jsonQuality: JSON.stringify(jsonQuality) }),
      });

      const result = await service.qualityProblems(2026, 7, jsonQuality[0].jsonDimensionQuality[0].codigo);

      expect(result).toEqual([]);
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('consulta los pacientes/notificaciones asociados a los ids no válidos y elimina duplicados', async () => {
      const jsonQuality = [makeDimension(DIMENSION_CALIDAD.EXACTITUD)];
      jsonQuality[0].jsonDimensionQuality[0].idNotificacionesNoValidos = ['n1', 'n1', 'n2'];
      mockRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ jsonQuality: JSON.stringify(jsonQuality) }),
      });
      mockDataSource.query.mockResolvedValue([
        { ID: 'n1', NOMBRE: 'Paciente Uno' },
        { ID: 'n1', NOMBRE: 'Paciente Uno Duplicado' },
        { ID: 'n2', NOMBRE: 'Paciente Dos' },
      ]);

      const result = await service.qualityProblems(2026, 7, jsonQuality[0].jsonDimensionQuality[0].codigo);

      expect(mockDataSource.query).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
    });
  });

  // ─── getHistoryQuality ──────────────────────────────────────────────────

  describe('getHistoryQuality', () => {
    it('lanza error si las fechas son inválidas', async () => {
      await expect(service.getHistoryQuality(undefined as any, undefined as any)).rejects.toThrow(
        'Fechas inválidas proporcionadas',
      );
    });

    it('lanza error si alguna fecha no es parseable', async () => {
      await expect(
        service.getHistoryQuality(new Date('not-a-date'), new Date('2026-07-01')),
      ).rejects.toThrow('Fechas inválidas proporcionadas');
    });

    it('retorna los registros filtrados por rango de mes cuando el año coincide con inicio y fin', async () => {
      mockRepository.find.mockResolvedValue([
        { anio: 2026, mes: 5, jsonQuality: '[]' },
        { anio: 2026, mes: 6, jsonQuality: '[]' },
        { anio: 2026, mes: 8, jsonQuality: '[]' },
      ]);

      const result = await service.getHistoryQuality(
        new Date(2026, 5, 15), // 15-jun-2026 (fecha local, evita saltos de mes por zona horaria)
        new Date(2026, 6, 15), // 15-jul-2026
      );

      expect(mockRepository.find).toHaveBeenCalledTimes(1);
      expect(result.map((r: any) => r.mes)).toEqual([6]);
    });
  });
});
