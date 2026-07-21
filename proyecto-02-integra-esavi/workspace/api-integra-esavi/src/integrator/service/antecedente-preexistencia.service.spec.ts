import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AntecedentePreexistenciaService } from './antecedente-preexistencia.service';
import { AntecedentePreexistencia } from '../entity/antecedente-preexistencia.entity';
import { Notificacion } from '../entity/notificacion.entity';

const mockRepo = {
  delete: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  merge: jest.fn(),
};

const makeNotificacion = (id = 'notif-1'): Notificacion => ({ id } as Notificacion);

describe('AntecedentePreexistenciaService', () => {
  let service: AntecedentePreexistenciaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AntecedentePreexistenciaService,
        { provide: getRepositoryToken(AntecedentePreexistencia, 'POSTGRES_INTEGRATOR_DS'), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<AntecedentePreexistenciaService>(AntecedentePreexistenciaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('crea un registro nuevo cuando no existe uno previo para la notificación (sin borrar nada)', async () => {
      mockRepo.find.mockResolvedValue([]);
      mockRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const notificacion = makeNotificacion();
      const result = await service.create(notificacion, {
        descripcion: 'Hipertensión',
        codigoEsaviCIE10: 'I10',
      } as any);

      expect(mockRepo.delete).not.toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      expect(result.descripcion).toBe('Hipertensión');
      expect(result.createdBy).toBe('AUTOMATICO');
      expect(result.notificacion).toBe(notificacion);
    });

    it('actualiza el registro existente en vez de borrarlo y recrearlo (upsert por notificación)', async () => {
      const existente = {
        id: 'ap-1',
        descripcion: 'Diabetes',
        codigoEsaviCIE10: 'E11',
        notificacion: makeNotificacion(),
      } as AntecedentePreexistencia;
      mockRepo.find.mockResolvedValue([existente]);
      mockRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const notificacion = makeNotificacion();
      const result = await service.create(notificacion, {
        descripcion: 'Diabetes tipo 2',
      } as any);

      expect(mockRepo.delete).not.toHaveBeenCalled();
      expect(result).toBe(existente);
      expect(result.id).toBe('ap-1'); // mismo registro, no uno nuevo
      expect(result.descripcion).toBe('Diabetes tipo 2'); // campo actualizado
      expect(result.codigoEsaviCIE10).toBe('E11'); // campo no incluido en el DTO se conserva
    });

    it('no pisa campos existentes con null/undefined que vengan en el DTO', async () => {
      const existente = {
        id: 'ap-2',
        descripcion: 'Asma',
        codigoEsaviCIE10: 'J45',
        notificacion: makeNotificacion(),
      } as AntecedentePreexistencia;
      mockRepo.find.mockResolvedValue([existente]);
      mockRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.create(makeNotificacion(), {
        descripcion: 'Asma',
        codigoEsaviCIE10: null,
      } as any);

      expect(result.codigoEsaviCIE10).toBe('J45');
    });

    it('propaga el error de guardado (el return final no lleva await, igual que en los servicios hermanos)', async () => {
      mockRepo.find.mockResolvedValue([]);
      mockRepo.save.mockRejectedValue(new Error('fallo de BD'));

      await expect(
        service.create(makeNotificacion(), { descripcion: 'x', codigoEsaviCIE10: 'X00' } as any),
      ).rejects.toThrow('fallo de BD');
    });
  });

  describe('findAntecedentePreexistenciaByNotificacionUUID', () => {
    it('busca por el id de la notificación', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.findAntecedentePreexistenciaByNotificacionUUID('notif-9');
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { notificacion: { id: 'notif-9' } },
      });
    });
  });

  describe('update', () => {
    it('actualiza un registro existente', async () => {
      const existente = { id: 'ap-3', descripcion: 'Vieja' } as AntecedentePreexistencia;
      mockRepo.findOne.mockResolvedValue(existente);
      mockRepo.merge.mockImplementation((entity, dto) => Object.assign(entity, dto));
      mockRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.update('ap-3', { descripcion: 'Nueva' } as any);

      expect(mockRepo.merge).toHaveBeenCalled();
      expect(result.descripcion).toBe('Nueva');
    });

    it('retorna undefined si el registro no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.update('inexistente', { descripcion: 'x' } as any);
      expect(result).toBeUndefined();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll / findOne', () => {
    it('findAll delega en el repositorio', async () => {
      mockRepo.find.mockResolvedValue([{ id: 'a' }]);
      const result = await service.findAll();
      expect(result).toEqual([{ id: 'a' }]);
    });

    it('findOne busca por id', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'a' });
      const result = await service.findOne('a');
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'a' } });
      expect(result).toEqual({ id: 'a' });
    });
  });
});
