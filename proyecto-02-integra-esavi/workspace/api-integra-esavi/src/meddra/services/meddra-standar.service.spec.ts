import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { cie10Meddra } from '../models/mapping/cie19meddra.entity';
import { CIE10ES } from '../models/standar/cie_10_meddra.entity';
import { LLT } from '../models/standar/llt.entity';
import { PT } from '../models/standar/pt.entity';
import { SOC } from '../models/standar/soc.entity';
import { MeddraStandarService } from './meddra-standar.service';

describe('MeddraStandarService', () => {
  let service: MeddraStandarService;
  let lltRepository: jest.Mocked<Repository<LLT>>;
  let ptRepository: jest.Mocked<Repository<PT>>;
  let socRepository: jest.Mocked<Repository<SOC>>;
  let cie10MeddraRepository: jest.Mocked<Repository<cie10Meddra>>;
  let cie10ESRepository: jest.Mocked<Repository<CIE10ES>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeddraStandarService,
        { provide: getRepositoryToken(LLT, 'MEDDRA'), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(PT, 'MEDDRA'), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(SOC, 'MEDDRA'), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(cie10Meddra, 'MEDDRA'), useValue: { find: jest.fn(), findOne: jest.fn() } },
        { provide: getRepositoryToken(CIE10ES, 'MEDDRA'), useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get<MeddraStandarService>(MeddraStandarService);
    lltRepository = module.get(getRepositoryToken(LLT, 'MEDDRA'));
    ptRepository = module.get(getRepositoryToken(PT, 'MEDDRA'));
    socRepository = module.get(getRepositoryToken(SOC, 'MEDDRA'));
    cie10MeddraRepository = module.get(getRepositoryToken(cie10Meddra, 'MEDDRA'));
    cie10ESRepository = module.get(getRepositoryToken(CIE10ES, 'MEDDRA'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── buscarLltPorSimilitud ───────────────────────────────────────────────

  describe('buscarLltPorSimilitud', () => {
    it('retorna null si el nombre es vacío o solo espacios', async () => {
      expect(await service.buscarLltPorSimilitud('')).toBeNull();
      expect(await service.buscarLltPorSimilitud('   ')).toBeNull();
      expect(await service.buscarLltPorSimilitud(null as any)).toBeNull();
      expect(cie10MeddraRepository.find).not.toHaveBeenCalled();
    });

    it('retorna null cuando ningún registro supera el umbral de similitud (90%)', async () => {
      cie10MeddraRepository.find.mockResolvedValue([
        { meddra_llt_name: 'ZZZZZZZZZZ' } as cie10Meddra,
      ]);

      const result = await service.buscarLltPorSimilitud('ACETAMINOPHEN');

      expect(result).toBeNull();
    });

    it('retorna el registro con mayor similitud entre los candidatos que superan el umbral', async () => {
      const mejor = { meddra_llt_name: 'ACETAMINOPHEN', meddra_llt_code: 'C1' } as cie10Meddra;
      const peor = { meddra_llt_name: 'ACETAMINOPHENE', meddra_llt_code: 'C2' } as cie10Meddra;
      cie10MeddraRepository.find.mockResolvedValue([peor, mejor]);

      const result = await service.buscarLltPorSimilitud('acetaminophen');

      expect(result).toEqual(mejor);
    });

    it('normaliza mayúsculas/minúsculas y espacios al comparar', async () => {
      const registro = { meddra_llt_name: 'headache' } as cie10Meddra;
      cie10MeddraRepository.find.mockResolvedValue([registro]);

      const result = await service.buscarLltPorSimilitud('   HEADACHE  ');

      expect(result).toEqual(registro);
    });
  });

  // ─── getLltByCode ────────────────────────────────────────────────────────

  describe('getLltByCode', () => {
    it('arma el DTO combinando LLT, PT, SOC y CIE10-MedDRA cuando todos existen', async () => {
      lltRepository.findOne.mockResolvedValue({ code: 'LLT001', name: 'Headache', ptCode: 'PT001' } as LLT);
      ptRepository.findOne.mockResolvedValue({ code: 'PT001', name: 'Head disorders', socCode: 'SOC001' } as PT);
      socRepository.findOne.mockResolvedValue({ code: 'SOC001', name: 'Nervous system disorders' } as SOC);
      cie10MeddraRepository.findOne.mockResolvedValue({
        icd10_code: 'R51',
        equivalence: 'EXACT',
      } as cie10Meddra);
      cie10ESRepository.findOne.mockResolvedValue({ icd10Code: 'R51' } as CIE10ES);

      const result = await service.getLltByCode('llt001');

      expect(result.lltCode).toBe('LLT001');
      expect(result.lltName).toBe('Headache');
      expect(result.ptCode).toBe('PT001');
      expect(result.ptName).toBe('Head disorders');
      expect(result.socCode).toBe('SOC001');
      expect(result.socName).toBe('Nervous system disorders');
      expect(result.cie10Code).toBe('R51');
      expect(result.cie10MeddraEquivalence).toBe('EXACT');
    });

    it('retorna el DTO con campos indefinidos cuando el LLT no existe', async () => {
      lltRepository.findOne.mockResolvedValue(null);
      ptRepository.findOne.mockResolvedValue(null);
      socRepository.findOne.mockResolvedValue(null);
      cie10MeddraRepository.findOne.mockResolvedValue(null);
      cie10ESRepository.findOne.mockResolvedValue(null);

      const result = await service.getLltByCode('NOEXISTE');

      expect(result.lltCode).toBeUndefined();
      expect(result.ptCode).toBeUndefined();
      expect(result.socCode).toBeUndefined();
      expect(result.cie10Code).toBeUndefined();
    });
  });
});
