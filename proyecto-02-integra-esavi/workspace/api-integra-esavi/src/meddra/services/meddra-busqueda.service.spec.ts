import {Test,TestingModule} from '@nestjs/testing';
import {getRepositoryToken} from '@nestjs/typeorm';
import {LLT} from '../models/standar/llt.entity';
import {PT} from '../models/standar/pt.entity';
import {SOC} from '../models/standar/soc.entity';
import {MeddraBusquedaService} from './meddra-busqueda.service';

/**
 * Query builder de mentira: encadena como el de TypeORM y devuelve lo que se le configure
 * en `filas`, ya recortado por el skip/take que reciba, para poder comprobar el reparto de
 * la ventana de paginación entre los tres niveles.
 */
const crearQueryBuilder = () => {
  const estado = { filas: [] as any[], skip: 0, take: Infinity };
  const qb: any = {
    estado,
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn((valor: number) => {
      estado.skip = valor;
      return qb;
    }),
    take: jest.fn((valor: number) => {
      estado.take = valor;
      return qb;
    }),
    getCount: jest.fn(async () => estado.filas.length),
    getMany: jest.fn(async () => estado.filas.slice(estado.skip, estado.skip + estado.take)),
  };
  return qb;
};

describe('MeddraBusquedaService', () => {
  let service: MeddraBusquedaService;
  let qbSoc: any;
  let qbPt: any;
  let qbLlt: any;
  let socFind: jest.Mock;
  let ptFind: jest.Mock;

  const soc = (code: string, name: string): SOC => ({ code, name, abbrev: `AB-${code}` } as SOC);
  const pt = (code: string, name: string, socCode: string): PT =>
    ({ code, name, socCode } as PT);
  const llt = (code: string, name: string, ptCode: string): LLT =>
    ({ code, name, ptCode, currency: 'Y' } as LLT);

  beforeEach(async () => {
    qbSoc = crearQueryBuilder();
    qbPt = crearQueryBuilder();
    qbLlt = crearQueryBuilder();
    socFind = jest.fn().mockResolvedValue([]);
    ptFind = jest.fn().mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeddraBusquedaService,
        {
          provide: getRepositoryToken(SOC, 'MEDDRA'),
          useValue: { createQueryBuilder: () => qbSoc, find: socFind },
        },
        {
          provide: getRepositoryToken(PT, 'MEDDRA'),
          useValue: { createQueryBuilder: () => qbPt, find: ptFind },
        },
        {
          provide: getRepositoryToken(LLT, 'MEDDRA'),
          useValue: { createQueryBuilder: () => qbLlt, find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(MeddraBusquedaService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Término vacío ────────────────────────────────────────────────────────

  it.each([['', 'vacío'], ['   ', 'sólo espacios'], [undefined, 'indefinido']])(
    'no consulta la base con un término %s (%s)',
    async (term) => {
      const resultado = await service.buscar(term as string, 0, 20);

      expect(resultado).toEqual({ data: [], total: 0, totalPorNivel: { soc: 0, pt: 0, llt: 0 } });
      expect(qbSoc.getCount).not.toHaveBeenCalled();
      expect(qbPt.getCount).not.toHaveBeenCalled();
      expect(qbLlt.getCount).not.toHaveBeenCalled();
    },
  );

  // ─── Cobertura de los tres niveles ────────────────────────────────────────

  it('busca el mismo término en SOC, PT y LLT y suma los tres totales', async () => {
    qbSoc.estado.filas = [soc('10', 'Trastornos generales')];
    qbPt.estado.filas = [pt('20', 'Cefalea', '10')];
    qbLlt.estado.filas = [llt('30', 'Dolor de cabeza', '20')];
    ptFind.mockResolvedValue([pt('20', 'Cefalea', '10')]);

    const resultado = await service.buscar('cefalea', 0, 20);

    expect(resultado.total).toBe(3);
    expect(resultado.totalPorNivel).toEqual({ soc: 1, pt: 1, llt: 1 });
    expect(resultado.data.map((c) => c.nivel)).toEqual(['SOC', 'PT', 'LLT']);
  });

  it('compara el término contra código y nombre en cada nivel', async () => {
    await service.buscar('123', 0, 20);

    expect(qbSoc.where).toHaveBeenCalledWith(
      'LOWER(soc.code) LIKE :patron OR LOWER(soc.name) LIKE :patron OR LOWER(soc.abbrev) LIKE :patron',
      { patron: '%123%' },
    );
    expect(qbPt.where).toHaveBeenCalledWith(
      'LOWER(pt.code) LIKE :patron OR LOWER(pt.name) LIKE :patron',
      { patron: '%123%' },
    );
    expect(qbLlt.where).toHaveBeenCalledWith(
      'LOWER(llt.code) LIKE :patron OR LOWER(llt.name) LIKE :patron',
      { patron: '%123%' },
    );
  });

  it('normaliza el término a minúsculas y sin espacios de sobra', async () => {
    await service.buscar('  Cefalea  ', 0, 20);

    expect(qbPt.where).toHaveBeenCalledWith(expect.any(String), { patron: '%cefalea%' });
  });

  it('escapa los comodines de LIKE para que se busquen como texto literal', async () => {
    await service.buscar('50%_a\\b', 0, 20);

    expect(qbPt.where).toHaveBeenCalledWith(expect.any(String), {
      patron: '%50\\%\\_a\\\\b%',
    });
  });

  // ─── Camino hasta la raíz ─────────────────────────────────────────────────

  it('devuelve el SOC padre de un PT coincidente', async () => {
    qbPt.estado.filas = [pt('20', 'Cefalea', '10')];
    socFind.mockResolvedValue([soc('10', 'Trastornos generales')]);

    const { data } = await service.buscar('cefalea', 0, 20);

    expect(data).toHaveLength(1);
    expect(data[0].soc).toEqual({ code: '10', name: 'Trastornos generales', abbrev: 'AB-10' });
    expect(data[0].pt).toEqual({ code: '20', name: 'Cefalea', socCode: '10' });
    expect(data[0].llt).toBeNull();
  });

  it('devuelve el PT y el SOC ancestros de un LLT coincidente', async () => {
    qbLlt.estado.filas = [llt('30', 'Dolor de cabeza', '20')];
    ptFind.mockResolvedValue([pt('20', 'Cefalea', '10')]);
    socFind.mockResolvedValue([soc('10', 'Trastornos generales')]);

    const { data } = await service.buscar('dolor', 0, 20);

    expect(data[0]).toEqual({
      nivel: 'LLT',
      soc: { code: '10', name: 'Trastornos generales', abbrev: 'AB-10' },
      pt: { code: '20', name: 'Cefalea', socCode: '10' },
      llt: { code: '30', name: 'Dolor de cabeza', ptCode: '20', currency: 'Y' },
    });
  });

  it('devuelve la coincidencia aunque el diccionario no tenga sus ancestros', async () => {
    qbLlt.estado.filas = [llt('30', 'Dolor de cabeza', 'PT-INEXISTENTE')];

    const { data } = await service.buscar('dolor', 0, 20);

    expect(data[0].nivel).toBe('LLT');
    expect(data[0].pt).toBeNull();
    expect(data[0].soc).toBeNull();
    expect(data[0].llt?.code).toBe('30');
  });

  it('no vuelve a consultar los ancestros que ya vinieron como coincidencia', async () => {
    qbSoc.estado.filas = [soc('10', 'Cefalea y afines')];
    qbPt.estado.filas = [pt('20', 'Cefalea', '10')];

    await service.buscar('cefalea', 0, 20);

    expect(socFind).not.toHaveBeenCalled();
  });

  it('pide cada ancestro una sola vez aunque lo compartan varias coincidencias', async () => {
    qbLlt.estado.filas = [llt('30', 'Dolor A', '20'), llt('31', 'Dolor B', '20')];
    ptFind.mockResolvedValue([pt('20', 'Cefalea', '10')]);
    socFind.mockResolvedValue([soc('10', 'Trastornos generales')]);

    await service.buscar('dolor', 0, 20);

    expect(ptFind).toHaveBeenCalledTimes(1);
    expect(socFind).toHaveBeenCalledTimes(1);
  });

  // ─── Paginación a través de los tres segmentos ────────────────────────────

  it('reparte una página que cae entera en el primer nivel', async () => {
    qbSoc.estado.filas = [soc('1', 'A'), soc('2', 'B'), soc('3', 'C')];
    qbPt.estado.filas = [pt('20', 'Cefalea', '1')];

    const { data } = await service.buscar('x', 0, 2);

    expect(data.map((c) => c.soc?.code)).toEqual(['1', '2']);
    expect(qbPt.getMany).not.toHaveBeenCalled();
  });

  it('reparte una página que cruza la frontera entre dos niveles', async () => {
    qbSoc.estado.filas = [soc('1', 'A'), soc('2', 'B'), soc('3', 'C')];
    qbPt.estado.filas = [pt('20', 'PT uno', '1'), pt('21', 'PT dos', '1')];
    socFind.mockResolvedValue([soc('1', 'A')]);

    const { data } = await service.buscar('x', 1, 2);

    expect(data.map((c) => c.nivel)).toEqual(['SOC', 'PT']);
    expect(data[0].soc?.code).toBe('3');
    expect(data[1].pt?.code).toBe('20');
  });

  it('salta los niveles previos cuando la página empieza en el último', async () => {
    qbSoc.estado.filas = [soc('1', 'A')];
    qbPt.estado.filas = [pt('20', 'PT uno', '1')];
    qbLlt.estado.filas = [llt('30', 'LLT uno', '20'), llt('31', 'LLT dos', '20')];
    ptFind.mockResolvedValue([pt('20', 'PT uno', '1')]);
    socFind.mockResolvedValue([soc('1', 'A')]);

    const { data, total } = await service.buscar('x', 1, 2);

    expect(total).toBe(4);
    expect(qbSoc.getMany).not.toHaveBeenCalled();
    expect(qbPt.getMany).not.toHaveBeenCalled();
    expect(data.map((c) => c.llt?.code)).toEqual(['30', '31']);
  });

  it('devuelve una página vacía más allá del último resultado sin fallar', async () => {
    qbSoc.estado.filas = [soc('1', 'A')];

    const { data, total } = await service.buscar('x', 5, 20);

    expect(data).toEqual([]);
    expect(total).toBe(1);
  });

  it('trata una página o un tamaño inválidos como los valores por defecto', async () => {
    qbSoc.estado.filas = [soc('1', 'A'), soc('2', 'B')];

    const { data } = await service.buscar('x', -3, 0);

    expect(data.map((c) => c.soc?.code)).toEqual(['1', '2']);
  });
});
