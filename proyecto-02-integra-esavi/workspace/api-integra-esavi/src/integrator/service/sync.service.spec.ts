import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SyncProcess, SyncSource, SyncStatus } from '../entity';
import { SyncService } from './sync.service';

/**
 * `ejecutarConRegistro` es el único camino por el que se escribe TR_SYNC_PROCESS:
 * MedDRA, WHODrug, datamart, vacunómetro, DHIS2, VigiFlow y el seed pasan todos
 * por aquí. Antes cada uno abría y cerraba sus filas por su cuenta.
 */
describe('SyncService', () => {
  let service: SyncService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      create: jest.fn((entity) => entity),
      save: jest.fn(async (entity) => ({ ...entity, id: 'corrida-1' })),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findOneBy: jest.fn().mockResolvedValue(null),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: getRepositoryToken(SyncProcess, 'POSTGRES_INTEGRATOR_DS'), useValue: repo },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('ejecutarConRegistro', () => {
    it('abre la corrida en RUNNING con su fuente y la cierra en COMPLETED', async () => {
      const resultado = await service.ejecutarConRegistro(SyncSource.MEDDRA, 'Carga 27.0/ES', async () => ({
        resultado: { soc: 1 },
        mensaje: 'listo',
      }));

      const abierta = repo.save.mock.calls[0][0];
      expect(abierta.source).toBe(SyncSource.MEDDRA);
      expect(abierta.status).toBe(SyncStatus.RUNNING);
      expect(abierta.startTime).toBeInstanceOf(Date);
      expect(abierta.endTime).toBeNull();

      expect(repo.update).toHaveBeenCalledWith(
        'corrida-1',
        expect.objectContaining({ status: SyncStatus.COMPLETED, message: 'listo' }),
      );
      expect(resultado).toEqual({ soc: 1 });
    });

    it('entrega al proceso el id de su propia corrida', async () => {
      const proceso = jest.fn(async () => ({ mensaje: 'ok' }));

      await service.ejecutarConRegistro(SyncSource.WHODRUG, 'Sync', proceso);

      expect(proceso).toHaveBeenCalledWith('corrida-1');
    });

    it('cierra la corrida en FAILED con el mensaje y el stack, y relanza el error', async () => {
      const error = new Error('conexión rechazada');

      await expect(
        service.ejecutarConRegistro(SyncSource.WHODRUG, 'Sync', async () => {
          throw error;
        }),
      ).rejects.toThrow('conexión rechazada');

      expect(repo.update).toHaveBeenCalledWith(
        'corrida-1',
        expect.objectContaining({
          status: SyncStatus.FAILED,
          errorMessage: 'conexión rechazada',
          errorStack: error.stack,
        }),
      );
    });

    it('registra también los valores lanzados que no son Error', async () => {
      await expect(
        service.ejecutarConRegistro(SyncSource.DHIS2, 'Import', async () => {
          throw 'cadena plana';
        }),
      ).rejects.toBe('cadena plana');

      expect(repo.update).toHaveBeenCalledWith(
        'corrida-1',
        expect.objectContaining({ errorMessage: 'cadena plana', errorStack: null }),
      );
    });

    it('fusiona los metadatos iniciales con los que devuelve el proceso al terminar', async () => {
      await service.ejecutarConRegistro(
        SyncSource.WHODRUG,
        'Sync',
        async () => ({ mensaje: 'ok', metadata: { sha256: 'abc', drugs: 10 } }),
        { metadata: { origen: 'UMC' } },
      );

      expect(repo.update).toHaveBeenCalledWith(
        'corrida-1',
        expect.objectContaining({ metadata: { origen: 'UMC', sha256: 'abc', drugs: 10 } }),
      );
    });

    it('propaga el rango de datos importados', async () => {
      const desde = new Date('2024-01-01');
      const hasta = new Date('2024-01-31');

      await service.ejecutarConRegistro(
        SyncSource.VACUNOMETRO,
        'Vacunómetro',
        async () => ({ mensaje: 'ok' }),
        { dataStartDate: desde, dataEndDate: hasta },
      );

      const abierta = repo.save.mock.calls[0][0];
      expect(abierta.dataStartDate).toBe(desde);
      expect(abierta.dataEndDate).toBe(hasta);
    });
  });

  describe('buscarPorMetadatos', () => {
    it('filtra por fuente, estado COMPLETED y cada par de metadatos', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'corrida-previa' }),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const encontrada = await service.buscarPorMetadatos(SyncSource.MEDDRA, {
        version: '27.0',
        lang: 'ES',
      });

      expect(qb.where).toHaveBeenCalledWith('sync.source = :source', { source: SyncSource.MEDDRA });
      // Sólo las corridas COMPLETED cuentan: una carga a medias debe poder reintentarse.
      expect(qb.andWhere).toHaveBeenCalledWith('sync.status = :status', {
        status: SyncStatus.COMPLETED,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('sync.metadata ->> :clave0 = :valor0', {
        clave0: 'version',
        valor0: '27.0',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('sync.metadata ->> :clave1 = :valor1', {
        clave1: 'lang',
        valor1: 'ES',
      });
      expect(encontrada).toEqual({ id: 'corrida-previa' });
    });
  });

  describe('getPaginated', () => {
    it('acota por fuente cuando se envía el filtro', async () => {
      await service.getPaginated({
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'startTime', order: 'DESC' },
        filter: { source: SyncSource.DATAMART },
      });

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { source: SyncSource.DATAMART } }),
      );
    });

    it('devuelve el log completo cuando no se filtra por fuente', async () => {
      await service.getPaginated({
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'startTime', order: 'DESC' },
        filter: {},
      });

      expect(repo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
  });
});
