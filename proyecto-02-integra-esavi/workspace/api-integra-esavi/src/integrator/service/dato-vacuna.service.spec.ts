import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DatoVacunaService } from './dato-vacuna.service';
import { DatoVacuna } from '../entity/dato-vacuna.entity';
import { DatoVacunacion } from '../entity/dato-vacunacion.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { CatalogoPadreService } from './catalogo-padre.service';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockDatoVacunacionRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockCatalogoPadreService = {
  buscarSubcategoriaPorSimilitud: jest.fn(),
};

const makeNotif = (id = 'n1'): Notificacion => ({ id } as Notificacion);

// En el flujo VigiFlow el caché se precarga por notificacion.id y create() busca por
// datoVacunacion.id, por eso en las pruebas ambos comparten el mismo identificador.
const makeDatoVacunacion = (id = 'n1'): DatoVacunacion => ({ id } as DatoVacunacion);

const makeDvMinimo = (id: string, notifId = 'n1'): Partial<DatoVacuna> => ({
  id,
  codigoAtc: null,
  rolVacuna: null,
  numeroLote: null,
  indicacionMeddra: null,
  datoVacunacion: { id: notifId, notificacion: { id: notifId } } as DatoVacunacion,
});

const makeDvCompleto = (id: string, codigoAtc: string, notifId = 'n1'): Partial<DatoVacuna> => ({
  id,
  codigoAtc,
  datoVacunacion: { id: notifId, notificacion: { id: notifId } } as DatoVacunacion,
});

describe('DatoVacunaService', () => {
  let service: DatoVacunaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatoVacunaService,
        { provide: getRepositoryToken(DatoVacuna, 'POSTGRES_INTEGRATOR_DS'), useValue: mockRepo },
        { provide: getRepositoryToken(DatoVacunacion, 'POSTGRES_INTEGRATOR_DS'), useValue: mockDatoVacunacionRepo },
        { provide: CatalogoPadreService, useValue: mockCatalogoPadreService },
      ],
    }).compile();
    service = module.get<DatoVacunaService>(DatoVacunaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── preloadByNotificacionIds ────────────────────────────────────────────

  describe('preloadByNotificacionIds', () => {
    it('inicializa mapas vacíos para arreglo vacío (sin consultar BD)', async () => {
      await service.preloadByNotificacionIds([]);
      expect(mockRepo.find).not.toHaveBeenCalled();
    });

    it('clasifica registros mínimo vs completo', async () => {
      mockRepo.find.mockResolvedValue([
        makeDvMinimo('dv1', 'n1'),      // mínimo (sin codigoAtc ni otros campos)
        makeDvCompleto('dv2', 'J07AA01', 'n1'), // completo
      ]);

      await service.preloadByNotificacionIds(['n1']);

      expect(mockRepo.find).toHaveBeenCalledTimes(1);
    });

    it('ignora registros sin datoVacunacion/notificacion', async () => {
      mockRepo.find.mockResolvedValue([
        { id: 'dv1', codigoAtc: null, rolVacuna: null, numeroLote: null, indicacionMeddra: null, datoVacunacion: null },
      ]);

      await expect(service.preloadByNotificacionIds(['n1'])).resolves.not.toThrow();
    });

    it('clasifica como mínimo cuando todos los campos discriminantes son nulos', async () => {
      mockRepo.find.mockResolvedValue([makeDvMinimo('dv1', 'n1')]);
      await service.preloadByNotificacionIds(['n1']);

      const result = await service.findByNotifIdDtoMinimo('n1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('dv1');
    });

    it('no clasifica como mínimo cuando tiene codigoAtc', async () => {
      mockRepo.find.mockResolvedValue([makeDvCompleto('dv2', 'J07AA01', 'n1')]);
      await service.preloadByNotificacionIds(['n1']);

      const result = await service.findByNotifIdDtoMinimo('n1');
      expect(result).toHaveLength(0);
    });
  });

  // ─── findByNotifIdDtoMinimo ──────────────────────────────────────────────

  describe('findByNotifIdDtoMinimo', () => {
    it('usa el caché cuando está disponible (sin consultar BD)', async () => {
      mockRepo.find.mockResolvedValue([makeDvMinimo('dv1', 'n1')]);
      await service.preloadByNotificacionIds(['n1']);

      const result = await service.findByNotifIdDtoMinimo('n1');

      expect(result).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledTimes(1); // solo preload
    });

    it('retorna arreglo vacío para notificacionId desconocido en caché', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.preloadByNotificacionIds(['n1']);

      const result = await service.findByNotifIdDtoMinimo('DESCONOCIDO');

      expect(result).toEqual([]);
    });

    it('consulta la BD cuando no hay caché', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.findByNotifIdDtoMinimo('n1');

      expect(mockRepo.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('retorna arreglo vacío cuando la BD falla (sin lanzar excepción)', async () => {
      mockRepo.find.mockRejectedValue(new Error('DB_ERROR'));

      const result = await service.findByNotifIdDtoMinimo('n1');

      expect(result).toEqual([]);
    });
  });

  // ─── invalidateMinimoEntry ───────────────────────────────────────────────

  describe('invalidateMinimoEntry', () => {
    it('es no-op cuando el caché es null (sin precarga)', () => {
      expect(() => service.invalidateMinimoEntry('n1', 'dv1')).not.toThrow();
    });

    it('es no-op cuando el notificacionId no está en el caché', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.preloadByNotificacionIds(['n1']);

      expect(() => service.invalidateMinimoEntry('DESCONOCIDO', 'dv1')).not.toThrow();
    });

    it('elimina el DatoVacuna específico de la lista', async () => {
      mockRepo.find.mockResolvedValue([
        makeDvMinimo('dv1', 'n1'),
        makeDvMinimo('dv2', 'n1'),
      ]);
      await service.preloadByNotificacionIds(['n1']);

      service.invalidateMinimoEntry('n1', 'dv1');

      const result = await service.findByNotifIdDtoMinimo('n1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('dv2');
    });

    it('elimina la clave del mapa cuando la lista queda vacía', async () => {
      mockRepo.find.mockResolvedValue([makeDvMinimo('dv1', 'n1')]);
      await service.preloadByNotificacionIds(['n1']);

      service.invalidateMinimoEntry('n1', 'dv1');

      const result = await service.findByNotifIdDtoMinimo('n1');
      expect(result).toEqual([]);
    });

    it('segunda llamada con el mismo id no lanza excepción', async () => {
      mockRepo.find.mockResolvedValue([makeDvMinimo('dv1', 'n1')]);
      await service.preloadByNotificacionIds(['n1']);

      service.invalidateMinimoEntry('n1', 'dv1');
      expect(() => service.invalidateMinimoEntry('n1', 'dv1')).not.toThrow();
    });
  });

  // ─── clearDatoVacunaCache ────────────────────────────────────────────────

  describe('clearDatoVacunaCache', () => {
    it('limpia ambos cachés y la siguiente llamada consulta la BD', async () => {
      mockRepo.find.mockResolvedValue([makeDvMinimo('dv1', 'n1')]);
      await service.preloadByNotificacionIds(['n1']);

      service.clearDatoVacunaCache();

      mockRepo.find.mockResolvedValue([]);
      await service.findByNotifIdDtoMinimo('n1');

      expect(mockRepo.find).toHaveBeenCalledTimes(2); // preload + consulta BD
    });

    it('no lanza excepción si se llama sin haber precargado', () => {
      expect(() => service.clearDatoVacunaCache()).not.toThrow();
    });
  });

  // ─── create - ruta con caché ─────────────────────────────────────────────

  describe('create - con caché activo', () => {
    it('usa caché mínimo cuando dto no tiene codigoAtc', async () => {
      const dvMinimo = makeDvMinimo('dv1', 'n1') as DatoVacuna;
      mockRepo.find.mockResolvedValue([dvMinimo]);
      await service.preloadByNotificacionIds(['n1']);
      mockRepo.save.mockResolvedValue(dvMinimo);

      await service.create(makeDatoVacunacion('n1'), { numeroDosisVacuna: 2 } as any);

      expect(mockRepo.findOne).not.toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('usa caché completo cuando dto tiene codigoAtc', async () => {
      const dvCompleto = makeDvCompleto('dv2', 'J07AA01', 'n1') as DatoVacuna;
      mockRepo.find.mockResolvedValue([dvCompleto]);
      await service.preloadByNotificacionIds(['n1']);
      mockRepo.save.mockResolvedValue(dvCompleto);

      await service.create(makeDatoVacunacion('n1'), { codigoAtc: 'J07AA01', numeroDosisVacuna: 1 } as any);

      expect(mockRepo.findOne).not.toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('crea nuevo cuando codigoAtc no está en caché completo', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.preloadByNotificacionIds(['n1']);
      const nuevo = makeDvCompleto('dv-new', 'J07ZZ99', 'n1') as DatoVacuna;
      mockRepo.save.mockResolvedValue(nuevo);

      await service.create(makeDatoVacunacion('n1'), { codigoAtc: 'J07ZZ99' } as any);

      expect(mockRepo.findOne).not.toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('solo actualiza numeroDosisVacuna en registro mínimo cuando viene en el dto', async () => {
      const dvMinimo = { ...makeDvMinimo('dv1', 'n1'), numeroDosisVacuna: 1 } as DatoVacuna;
      mockRepo.find.mockResolvedValue([dvMinimo]);
      await service.preloadByNotificacionIds(['n1']);
      mockRepo.save.mockResolvedValue({ ...dvMinimo, numeroDosisVacuna: 3 });

      await service.create(makeDatoVacunacion('n1'), { numeroDosisVacuna: 3 } as any);

      const savedArg: DatoVacuna = mockRepo.save.mock.calls[0][0];
      expect(savedArg.numeroDosisVacuna).toBe(3);
    });
  });

  // ─── create - ruta sin caché ─────────────────────────────────────────────

  describe('create - sin caché (consulta BD)', () => {
    it('consulta la BD cuando no hay caché', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue(makeDvMinimo('dv-new', 'n1') as DatoVacuna);

      await service.create(makeDatoVacunacion('n1'), {} as any);

      expect(mockRepo.findOne).toHaveBeenCalledTimes(1);
    });
  });

  // ─── createByNotificacion ────────────────────────────────────────────────

  describe('createByNotificacion', () => {
    it('reutiliza el DatoVacunacion existente de la notificación', async () => {
      const datoVacunacion = makeDatoVacunacion('dvz1');
      mockDatoVacunacionRepo.findOne.mockResolvedValue(datoVacunacion);
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue(makeDvCompleto('dv-new', 'J07AA01', 'dvz1') as DatoVacuna);

      await service.createByNotificacion(makeNotif('n1'), { codigoAtc: 'J07AA01' } as any);

      expect(mockDatoVacunacionRepo.findOne).toHaveBeenCalledWith({
        where: { notificacion: { id: 'n1' } },
      });
      expect(mockDatoVacunacionRepo.save).not.toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('crea el DatoVacunacion intermedio cuando la notificación no tiene uno', async () => {
      const notificacion = makeNotif('n1');
      const nuevoDatoVacunacion = makeDatoVacunacion('dvz-new');
      mockDatoVacunacionRepo.findOne.mockResolvedValue(null);
      mockDatoVacunacionRepo.create.mockReturnValue(nuevoDatoVacunacion);
      mockDatoVacunacionRepo.save.mockResolvedValue(nuevoDatoVacunacion);
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue(makeDvCompleto('dv-new', 'J07AA01', 'dvz-new') as DatoVacuna);

      await service.createByNotificacion(notificacion, { codigoAtc: 'J07AA01' } as any);

      expect(mockDatoVacunacionRepo.create).toHaveBeenCalledWith({ notificacion });
      expect(mockDatoVacunacionRepo.save).toHaveBeenCalledTimes(1);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  // ─── findByNotificacionId ────────────────────────────────────────────────

  describe('findByNotificacionId', () => {
    it('consulta la BD con relaciones correctas', async () => {
      mockRepo.find.mockResolvedValue([makeDvCompleto('dv1', 'J07AA01', 'n1')]);

      const result = await service.findByNotificacionId('n1');

      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['rolVacuna', 'datoVacunacion'] }),
      );
      expect(result).toHaveLength(1);
    });
  });
});
