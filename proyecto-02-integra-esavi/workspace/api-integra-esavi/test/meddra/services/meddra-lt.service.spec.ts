import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLT } from 'src/meddra/models/standar/llt.entity';
import { PT } from 'src/meddra/models/standar/pt.entity';
import { SOC } from 'src/meddra/models/standar/soc.entity';
import { MeddraLLTService } from 'src/meddra/services/meddra-lt.service';

describe('MeddraLLTService', () => {
  let service: MeddraLLTService;
  let lltRepository: jest.Mocked<Repository<LLT>>;
  let queryBuilder: any;

  const makeLLT = (overrides: Partial<LLT> = {}): LLT =>
    ({
      id: 1,
      code: 'LLT001',
      name: 'HEADACHE',
      ptCode: 'PT001',
      ...overrides,
    } as LLT);

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndMapOne: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getManyAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeddraLLTService,
        {
          provide: getRepositoryToken(LLT, 'MEDDRA'),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<MeddraLLTService>(MeddraLLTService);
    lltRepository = module.get(getRepositoryToken(LLT, 'MEDDRA'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── buscarPorSimilitud ──────────────────────────────────────────────────

  describe('buscarPorSimilitud', () => {
    it('retorna null si el nombre es vacío o solo espacios', async () => {
      expect(await service.buscarPorSimilitud('')).toBeNull();
      expect(await service.buscarPorSimilitud('   ')).toBeNull();
      expect(await service.buscarPorSimilitud(null as any)).toBeNull();
      expect(lltRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('retorna la coincidencia exacta si existe', async () => {
      const exacto = makeLLT({ name: 'HEADACHE' });
      queryBuilder.getOne.mockResolvedValue(exacto);

      const result = await service.buscarPorSimilitud('headache');

      expect(result).toEqual(exacto);
      expect(queryBuilder.where).toHaveBeenCalledWith('UPPER(llt.name) = :nombre', { nombre: 'HEADACHE' });
      // No debe intentar buscar candidatos por similitud
      expect(queryBuilder.getMany).not.toHaveBeenCalled();
    });

    it('cuando no hay coincidencia exacta, busca por prefijo y retorna el mejor candidato por similitud', async () => {
      queryBuilder.getOne.mockResolvedValue(null);
      // sim = 1 (idéntico, sirve para validar que se elige el de mayor similitud)
      const candidatoMejor = makeLLT({ name: 'ACETAMINOPHEN' });
      // sim = 13/14 ≈ 0.93 (un carácter extra), supera el umbral pero es peor que el anterior
      const candidatoPeor = makeLLT({ name: 'ACETAMINOPHENE' });
      queryBuilder.getMany.mockResolvedValue([candidatoPeor, candidatoMejor]);

      const result = await service.buscarPorSimilitud('ACETAMINOPHEN');

      expect(queryBuilder.where).toHaveBeenCalledWith('UPPER(llt.name) LIKE :like', { like: 'ACET%' });
      expect(result).toEqual(candidatoMejor);
    });

    it('retorna null cuando ningún candidato supera el umbral de similitud', async () => {
      queryBuilder.getOne.mockResolvedValue(null);
      queryBuilder.getMany.mockResolvedValue([makeLLT({ name: 'ZZZZZZZZZZ' })]);

      const result = await service.buscarPorSimilitud('HEADACHE');

      expect(result).toBeNull();
    });
  });

  // ─── buscarCodigoPorSimilitud ────────────────────────────────────────────

  describe('buscarCodigoPorSimilitud', () => {
    it('retorna el código cuando hay coincidencia', async () => {
      queryBuilder.getOne.mockResolvedValue(makeLLT({ code: 'LLT999' }));

      const result = await service.buscarCodigoPorSimilitud('HEADACHE');

      expect(result).toBe('LLT999');
    });

    it('retorna null cuando no hay coincidencia', async () => {
      queryBuilder.getOne.mockResolvedValue(null);
      queryBuilder.getMany.mockResolvedValue([]);

      const result = await service.buscarCodigoPorSimilitud('HEADACHE');

      expect(result).toBeNull();
    });
  });

  // ─── listLLTs ────────────────────────────────────────────────────────────

  describe('listLLTs', () => {
    it('retorna la lista paginada y el total usando skip/take', async () => {
      const data = [makeLLT()];
      queryBuilder.getManyAndCount.mockResolvedValue([data, 1]);

      const result = await service.listLLTs('PT001', 2, 10);

      expect(queryBuilder.where).toHaveBeenCalledWith('llt.ptCode = :ptCode', { ptCode: 'PT001' });
      expect(queryBuilder.skip).toHaveBeenCalledWith(20);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(result).toEqual({ data, total: 1 });
    });
  });

  // ─── searchLLT ───────────────────────────────────────────────────────────

  describe('searchLLT', () => {
    it('retorna null si el término es vacío o solo espacios', async () => {
      expect(await service.searchLLT('')).toBeNull();
      expect(await service.searchLLT('   ')).toBeNull();
      expect(lltRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('retorna el LLT cuando se encuentra por nombre', async () => {
      const llt = makeLLT();
      queryBuilder.getOne.mockResolvedValue(llt);

      const result = await service.searchLLT('Headache');

      expect(queryBuilder.where).toHaveBeenCalledWith('LOWER(llt.name) = :term', { term: 'headache' });
      expect(result).toEqual(llt);
    });

    it('retorna null cuando no se encuentra el término', async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      const result = await service.searchLLT('Inexistente');

      expect(result).toBeNull();
    });
  });

  // ─── searchLltByCode ─────────────────────────────────────────────────────

  describe('searchLltByCode', () => {
    it('retorna null si el código es vacío o solo espacios', async () => {
      expect(await service.searchLltByCode('')).toBeNull();
      expect(await service.searchLltByCode('   ')).toBeNull();
      expect(lltRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('une los ancestros por código y no por la relación de la entidad', async () => {
      // MED_LLT.ID_PT_CODE está vacía en todo el diccionario: la carga sólo llena PT_CODE.
      // Unir por la relación devolvía el PT en null y, en cascada, también el SOC.
      const llt = makeLLT();
      queryBuilder.getOne.mockResolvedValue(llt);

      const result = await service.searchLltByCode('LLT001');

      expect(queryBuilder.leftJoinAndMapOne).toHaveBeenCalledWith(
        'llt.pt',
        PT,
        'pt',
        'pt.code = llt.ptCode',
      );
      expect(queryBuilder.leftJoinAndMapOne).toHaveBeenCalledWith(
        'pt.soc',
        SOC,
        'soc',
        'soc.code = pt.socCode',
      );
      // Ninguna unión debe seguir dependiendo de la FK.
      expect(queryBuilder.leftJoinAndSelect).not.toHaveBeenCalled();
      expect(queryBuilder.where).toHaveBeenCalledWith('LOWER(llt.code) = :code', { code: 'llt001' });
      expect(result).toEqual(llt);
    });

    it('retorna null cuando no existe el código', async () => {
      queryBuilder.getOne.mockResolvedValue(null);

      const result = await service.searchLltByCode('NOEXISTE');

      expect(result).toBeNull();
    });
  });
});
