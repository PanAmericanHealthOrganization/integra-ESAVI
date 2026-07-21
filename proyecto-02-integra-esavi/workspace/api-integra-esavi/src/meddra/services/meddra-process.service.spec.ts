import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { SyncService } from 'src/integrator/service/sync.service';
import { cie10Meddra } from '../models/mapping/cie19meddra.entity';
import { MeddraSync } from '../models/standar/meddraSync.entity';
import { LLT } from '../models/standar/llt.entity';
import { PT } from '../models/standar/pt.entity';
import { SOC } from '../models/standar/soc.entity';
import { MeddraUtils } from '../utils/meddra.utils';
import { MeddraProcessFilesService } from './meddra-process.service';

jest.mock('xlsx');

describe('MeddraProcessFilesService', () => {
  let service: MeddraProcessFilesService;
  let socRepository: any;
  let ptRepository: any;
  let lltRepository: any;
  let meddraSyncRepository: any;
  let cie10MeddraRepository: any;
  let dataSource: any;
  let syncService: any;
  let queryRunner: any;

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    };

    socRepository = { insert: jest.fn(), find: jest.fn() };
    ptRepository = { insert: jest.fn(), find: jest.fn() };
    lltRepository = { insert: jest.fn() };
    meddraSyncRepository = { save: jest.fn(), update: jest.fn(), findOne: jest.fn() };
    cie10MeddraRepository = { save: jest.fn() };
    dataSource = { createQueryRunner: jest.fn().mockReturnValue(queryRunner) };
    // Por defecto ejecuta el proceso directamente y retorna su "resultado", igual que el SyncService real.
    syncService = {
      ejecutarConRegistro: jest.fn(async (_name: string, proceso: () => Promise<any>) => {
        const { resultado } = await proceso();
        return resultado;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeddraProcessFilesService,
        { provide: getRepositoryToken(SOC, 'MEDDRA'), useValue: socRepository },
        { provide: getRepositoryToken(PT, 'MEDDRA'), useValue: ptRepository },
        { provide: getRepositoryToken(LLT, 'MEDDRA'), useValue: lltRepository },
        { provide: getRepositoryToken(MeddraSync, 'MEDDRA'), useValue: meddraSyncRepository },
        { provide: getRepositoryToken(cie10Meddra, 'MEDDRA'), useValue: cie10MeddraRepository },
        { provide: getDataSourceToken('MEDDRA'), useValue: dataSource },
        { provide: SyncService, useValue: syncService },
      ],
    }).compile();

    service = module.get<MeddraProcessFilesService>(MeddraProcessFilesService);

    // Nunca se debe tocar el filesystem real.
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as any);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── processVersionFiles ─────────────────────────────────────────────────

  describe('processVersionFiles', () => {
    it('lanza BadRequestException si falta la versión o el idioma', async () => {
      await expect(service.processVersionFiles('', 'ES', 'desc')).rejects.toThrow(BadRequestException);
      await expect(service.processVersionFiles('27.0', '', 'desc')).rejects.toThrow(BadRequestException);
      await expect(service.processVersionFiles('   ', '   ', 'desc')).rejects.toThrow(BadRequestException);
    });

    it('lanza ConflictException si la versión/idioma ya existe', async () => {
      meddraSyncRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.processVersionFiles('27.0', 'ES', 'desc')).rejects.toThrow(ConflictException);
    });

    it('crea el directorio y lanza NotFoundException si no existe', async () => {
      meddraSyncRepository.findOne.mockResolvedValue(null);
      jest.spyOn(MeddraUtils, 'directoryExists').mockReturnValue(false);

      await expect(service.processVersionFiles('27.0', 'ES', 'desc')).rejects.toThrow(NotFoundException);
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('procesa SOC, PT y LLT exitosamente y marca la sincronización como FINISHED', async () => {
      meddraSyncRepository.findOne.mockResolvedValue(null);
      jest.spyOn(MeddraUtils, 'directoryExists').mockReturnValue(true);
      jest.spyOn(MeddraUtils, 'readFileContent').mockImplementation(async (_v, _l, file) => {
        if (file === 'soc.asc') return [['SOC1', 'Nombre SOC', 'ABBR']];
        if (file === 'pt.asc') return [['PT1', 'Nombre PT', '', 'SOC1']];
        if (file === 'llt.asc') return [['LLT1', 'Nombre LLT', 'PT1', '', '', '', '', '', '', 'ICD10-1']];
        return [];
      });

      meddraSyncRepository.save.mockResolvedValue({ id: 99 });
      socRepository.insert.mockResolvedValue({ identifiers: [{ id: 1 }] });
      socRepository.find.mockResolvedValue([{ id: 1, code: 'SOC1', name: 'Nombre SOC' }]);
      ptRepository.insert.mockResolvedValue({ identifiers: [{ id: 1 }] });
      ptRepository.find.mockResolvedValue([{ id: 1, code: 'PT1', name: 'Nombre PT', socCode: 'SOC1' }]);
      lltRepository.insert.mockResolvedValue({ identifiers: [{ id: 1 }] });
      meddraSyncRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.processVersionFiles('27.0', 'ES', 'desc');

      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(socRepository.insert).toHaveBeenCalledTimes(1);
      expect(ptRepository.insert).toHaveBeenCalledTimes(1);
      expect(lltRepository.insert).toHaveBeenCalledTimes(1);
      expect(meddraSyncRepository.update).toHaveBeenCalledWith(
        99,
        expect.objectContaining({ syncStatus: 'FINISHED' }),
      );
      expect(result.soc).toHaveLength(1);
      expect(result.pt).toHaveLength(1);
    });

    it('hace rollback y marca la sincronización como ERROR cuando falla el procesamiento', async () => {
      meddraSyncRepository.findOne.mockResolvedValue(null);
      jest.spyOn(MeddraUtils, 'directoryExists').mockReturnValue(true);
      jest.spyOn(MeddraUtils, 'readFileContent').mockImplementation(async (_v, _l, file) => {
        if (file === 'soc.asc') return [['SOC1', 'Nombre SOC', 'ABBR']];
        return [];
      });

      meddraSyncRepository.save.mockResolvedValue({ id: 5 });
      socRepository.insert.mockRejectedValue(new Error('fallo de insercion'));
      meddraSyncRepository.update.mockResolvedValue({ affected: 1 });

      await expect(service.processVersionFiles('27.0', 'ES', 'desc')).rejects.toThrow('fallo de insercion');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(meddraSyncRepository.update).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ syncStatus: 'ERROR' }),
      );
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  // ─── processCIE10Meddra ──────────────────────────────────────────────────

  describe('processCIE10Meddra', () => {
    it('lanza NotFoundException si el archivo no existe', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      await expect(service.processCIE10Meddra('1', 'ES')).rejects.toThrow(NotFoundException);
    });

    it('procesa el excel y guarda los registros CIE10-MedDRA, saltando filas vacías', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      (XLSX.readFile as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        [],
        ['1', 'Capitulo I', 'A00', 'Termino', 'LLT Name', 'LLT001', 'EXACT', 'PT Name', 'PT001'],
      ]);
      cie10MeddraRepository.save.mockResolvedValue([]);

      const result = await service.processCIE10Meddra('1', 'ES');

      expect(result).toBe(true);
      expect(cie10MeddraRepository.save).toHaveBeenCalledTimes(1);
      const savedChunk = cie10MeddraRepository.save.mock.calls[0][0];
      expect(savedChunk).toHaveLength(1);
      expect(savedChunk[0].icd10_code).toBe('A00');
      expect(savedChunk[0].meddra_llt_code).toBe('LLT001');
    });
  });

  // ─── validarVersion ──────────────────────────────────────────────────────

  describe('validarVersion', () => {
    it('retorna true si la versión/idioma ya está registrada', async () => {
      meddraSyncRepository.findOne.mockResolvedValue({ id: 1 });

      expect(await service.validarVersion('27.0', 'ES')).toBe(true);
    });

    it('retorna false si la versión/idioma no existe', async () => {
      meddraSyncRepository.findOne.mockResolvedValue(null);

      expect(await service.validarVersion('27.0', 'ES')).toBe(false);
    });
  });
});
