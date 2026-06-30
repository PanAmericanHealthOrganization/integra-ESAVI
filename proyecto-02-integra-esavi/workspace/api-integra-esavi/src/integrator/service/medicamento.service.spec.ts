import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MedicamentoService } from './medicamento.service';
import { Medicamento } from '../entity/medicamento.entity';
import { Notificacion } from '../entity/notificacion.entity';

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  merge: jest.fn(),
};

const makeNotif = (id = 'n1'): Notificacion => ({ id } as Notificacion);

const makeMed = (id: string, codigoATC: string, notifId = 'n1'): Partial<Medicamento> => ({
  id,
  codigoATC,
  notificacion: { id: notifId } as Notificacion,
} as Medicamento);

describe('MedicamentoService', () => {
  let service: MedicamentoService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicamentoService,
        { provide: getRepositoryToken(Medicamento, 'POSTGRES_INTEGRATOR_DS'), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<MedicamentoService>(MedicamentoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── preloadByNotificacionIds ────────────────────────────────────────────

  describe('preloadByNotificacionIds', () => {
    it('inicializa mapa vacío para arreglo vacío (sin consultar BD)', async () => {
      await service.preloadByNotificacionIds([]);
      expect(mockRepo.find).not.toHaveBeenCalled();
    });

    it('consulta en bloque y construye mapa anidado [notifId][codigoATC]', async () => {
      mockRepo.find.mockResolvedValue([
        makeMed('m1', 'J07AA01', 'n1'),
        makeMed('m2', 'J07BA01', 'n1'),
        makeMed('m3', 'J07AA01', 'n2'),
      ]);

      await service.preloadByNotificacionIds(['n1', 'n2']);

      expect(mockRepo.find).toHaveBeenCalledTimes(1);
    });

    it('ignora registros sin codigoATC o sin notificacion', async () => {
      mockRepo.find.mockResolvedValue([
        { id: 'm1', codigoATC: null, notificacion: { id: 'n1' } },
        { id: 'm2', codigoATC: 'J07AA01', notificacion: null },
      ]);

      await expect(service.preloadByNotificacionIds(['n1'])).resolves.not.toThrow();
    });
  });

  // ─── createOneToOne CON caché ────────────────────────────────────────────

  describe('createOneToOne - con caché activo', () => {
    const notif = makeNotif('n1');

    beforeEach(async () => {
      mockRepo.find.mockResolvedValue([makeMed('m1', 'J07AA01', 'n1')]);
      await service.preloadByNotificacionIds(['n1']);
    });

    it('actualiza medicamento existente encontrado en caché (sin findOne)', async () => {
      const saved = { id: 'm1', codigoATC: 'J07AA01', nombre: 'Vacuna-Nueva' };
      mockRepo.save.mockResolvedValue(saved);

      const result = await service.createOneToOne(notif, { codigoATC: 'J07AA01', nombre: 'Vacuna-Nueva' } as any);

      expect(result).toEqual(saved);
      expect(mockRepo.findOne).not.toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('crea nuevo medicamento cuando codigoATC no está en caché', async () => {
      const saved = { id: 'nuevo', codigoATC: 'J07ZZ99', notificacion: { id: 'n1' } };
      mockRepo.save.mockResolvedValue(saved);

      const result = await service.createOneToOne(notif, { codigoATC: 'J07ZZ99', nombre: 'Nueva' } as any);

      expect(result).toEqual(saved);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      expect(mockRepo.findOne).not.toHaveBeenCalled();
    });

    it('agrega el nuevo medicamento al caché tras crear', async () => {
      const saved = { id: 'nuevo', codigoATC: 'J07ZZ99', notificacion: { id: 'n1' } };
      mockRepo.save.mockResolvedValue(saved);

      await service.createOneToOne(notif, { codigoATC: 'J07ZZ99' } as any);

      // Volver a crear con el mismo codigoATC → debe encontrarse en caché (no llama findOne)
      mockRepo.save.mockResolvedValue(saved);
      await service.createOneToOne(notif, { codigoATC: 'J07ZZ99' } as any);

      expect(mockRepo.findOne).not.toHaveBeenCalled();
    });

    it('funciona con notificacion sin medicamentos en caché', async () => {
      const notifSinMeds = makeNotif('n99');
      const saved = { id: 'x1', codigoATC: 'J07AA01', notificacion: { id: 'n99' } };
      mockRepo.save.mockResolvedValue(saved);

      await expect(
        service.createOneToOne(notifSinMeds, { codigoATC: 'J07AA01' } as any),
      ).resolves.toEqual(saved);
    });
  });

  // ─── createOneToOne SIN caché ────────────────────────────────────────────

  describe('createOneToOne - sin caché (consulta BD)', () => {
    it('consulta la BD cuando no hay caché', async () => {
      const existing = { id: 'm1', codigoATC: 'J07AA01' };
      mockRepo.findOne.mockResolvedValue(existing);
      mockRepo.save.mockResolvedValue(existing);

      await service.createOneToOne(makeNotif(), { codigoATC: 'J07AA01', nombre: 'Updated' } as any);

      expect(mockRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('crea nuevo cuando la BD devuelve null', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const saved = { id: 'nuevo', codigoATC: 'J07ZZ99' };
      mockRepo.save.mockResolvedValue(saved);

      const result = await service.createOneToOne(makeNotif(), { codigoATC: 'J07ZZ99' } as any);

      expect(result).toEqual(saved);
    });

    it('propaga el error de la BD', async () => {
      mockRepo.findOne.mockRejectedValue(new Error('DB_ERROR'));

      await expect(
        service.createOneToOne(makeNotif(), { codigoATC: 'J07AA01' } as any),
      ).rejects.toThrow('DB_ERROR');
    });
  });

  // ─── clearMedicamentosCache ──────────────────────────────────────────────

  describe('clearMedicamentosCache', () => {
    it('limpia el caché y la siguiente llamada consulta la BD', async () => {
      mockRepo.find.mockResolvedValue([makeMed('m1', 'J07AA01', 'n1')]);
      await service.preloadByNotificacionIds(['n1']);

      service.clearMedicamentosCache();

      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue({ id: 'new' });
      await service.createOneToOne(makeNotif('n1'), { codigoATC: 'J07AA01' } as any);

      expect(mockRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('no lanza excepción si se llama sin haber precargado', () => {
      expect(() => service.clearMedicamentosCache()).not.toThrow();
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('retorna medicamento cuando existe', async () => {
      const med = makeMed('m1', 'J07AA01');
      mockRepo.findOne.mockResolvedValue(med);
      const result = await service.findOne('m1');
      expect(result).toEqual(med);
    });

    it('lanza EntityNotFoundException cuando no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('NOEXISTE')).rejects.toThrow();
    });
  });
});
