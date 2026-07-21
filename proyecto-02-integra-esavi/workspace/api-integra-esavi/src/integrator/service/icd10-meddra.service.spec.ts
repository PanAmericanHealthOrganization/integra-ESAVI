import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Icd10MeddraService } from './icd10-meddra.service';

const mockDataSource = {
  query: jest.fn(),
};

describe('Icd10MeddraService', () => {
  let service: Icd10MeddraService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Icd10MeddraService,
        { provide: getDataSourceToken('POSTGRES_INTEGRATOR_DS'), useValue: mockDataSource },
      ],
    }).compile();
    service = module.get<Icd10MeddraService>(Icd10MeddraService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buscarCodigoLlt', () => {
    it('retorna null si el nombre es vacío o sólo espacios, sin consultar la BD', async () => {
      const result = await service.buscarCodigoLlt('   ');
      expect(result).toBeNull();
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('retorna null si el nombre es undefined', async () => {
      const result = await service.buscarCodigoLlt(undefined as any);
      expect(result).toBeNull();
    });

    it('retorna el código cuando hay coincidencia exacta', async () => {
      mockDataSource.query.mockResolvedValueOnce([
        { MEDDRA_LLT_CODE: 'CODE1', MEDDRA_LLT: 'FIEBRE' },
      ]);

      const result = await service.buscarCodigoLlt('fiebre');

      expect(result).toBe('CODE1');
      expect(mockDataSource.query).toHaveBeenCalledTimes(1);
    });

    it('busca por similitud cuando no hay coincidencia exacta y retorna el mejor candidato sobre el umbral', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([]) // sin coincidencia exacta
        .mockResolvedValueOnce([
          { MEDDRA_LLT_CODE: 'CODE_LEJOS', MEDDRA_LLT: 'ALGO_MUY_DIFERENTE' },
          // 1 caracter distinto sobre 11: similitud = 10/11 ≈ 0.909, por encima del umbral 0.9
          { MEDDRA_LLT_CODE: 'CODE_CERCA', MEDDRA_LLT: 'PARACETAMOX' },
        ]);

      const result = await service.buscarCodigoLlt('PARACETAMOL');

      expect(result).toBe('CODE_CERCA');
      expect(mockDataSource.query).toHaveBeenCalledTimes(2);
    });

    it('retorna null si ningún candidato supera el umbral de similitud', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ MEDDRA_LLT_CODE: 'CODE1', MEDDRA_LLT: 'ALGO_COMPLETAMENTE_DISTINTO' }]);

      const result = await service.buscarCodigoLlt('FIEBRE');

      expect(result).toBeNull();
    });

    it('retorna null si no hay candidatos', async () => {
      mockDataSource.query.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      const result = await service.buscarCodigoLlt('DESCONOCIDO');
      expect(result).toBeNull();
    });
  });
});
