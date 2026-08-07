import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificacionDhis2Service } from './notificacion-dhis2.service';
import { Notificacion } from '../entity/notificacion.entity';
import { Parroquia } from '../entity/parroquia.entity';
import { Establecimiento } from '../entity/establecimiento.entity';
import { NotificadorService } from './notificador.service';
import { CatalogoPadreService } from './catalogo-padre.service';
import { EntityNotFoundException } from '../exception/enntity-not-found.exception';

const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

const mockNotificacionRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

const mockParroquiaRepo = {
  findOne: jest.fn(),
};

const mockEstablecimientoRepo = {
  findOne: jest.fn(),
};

const mockNotificadorService = {
  buscarProfesionPorNombre: jest.fn(),
  createOrUpdate: jest.fn(),
};

const mockCatalogoPadreService = {
  buscarSubcategoriaPorSimilitud: jest.fn(),
};

describe('NotificacionDhis2Service', () => {
  let service: NotificacionDhis2Service;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificacionDhis2Service,
        { provide: getRepositoryToken(Notificacion, 'POSTGRES_INTEGRATOR_DS'), useValue: mockNotificacionRepo },
        { provide: getRepositoryToken(Parroquia, 'POSTGRES_INTEGRATOR_DS'), useValue: mockParroquiaRepo },
        { provide: getRepositoryToken(Establecimiento, 'POSTGRES_INTEGRATOR_DS'), useValue: mockEstablecimientoRepo },
        { provide: NotificadorService, useValue: mockNotificadorService },
        { provide: CatalogoPadreService, useValue: mockCatalogoPadreService },
      ],
    }).compile();

    service = module.get<NotificacionDhis2Service>(NotificacionDhis2Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('crea una nueva notificación cuando no existe una con el mismo codigoDhis2Evento', async () => {
      mockNotificacionRepo.findOne.mockResolvedValue(null);
      mockNotificacionRepo.save.mockImplementation((n) => Promise.resolve({ ...n, id: 'n1' }));

      const paciente: any = { id: 'p1' };
      const result = await service.create(
        {
          codigoDhis2Evento: 'EVT-1',
          residenciaPaciente: {},
        } as any,
        paciente,
      );

      expect(mockNotificacionRepo.save).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('n1');
      expect(result.paciente).toEqual(paciente);
    });

    it('resuelve unidadEdad, parroquia, tipoEmisor y establecimiento al crear', async () => {
      mockNotificacionRepo.findOne.mockResolvedValue(null);
      mockNotificacionRepo.save.mockImplementation((n) => Promise.resolve(n));
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud.mockImplementation((tipo: string) =>
        Promise.resolve({ id: `cp-${tipo}` }),
      );
      mockParroquiaRepo.findOne.mockResolvedValue({ id: 'parr-1' });
      mockEstablecimientoRepo.findOne.mockResolvedValue({ id: 'est-1' });

      const result = await service.create(
        {
          codigoDhis2Evento: 'EVT-2',
          unidadEdadPaciente: 'Años',
          residenciaPaciente: { parroquia: 'Quito (170150)' },
          tipoEmisor: 'Profesional de la salud',
          codigoUnidadSalud: '170150',
        } as any,
        { id: 'p1' } as any,
      );

      expect(result.unidadEdad).toEqual({ id: 'cp-UNIDAD_EDAD' });
      expect(result.parroquiaResidencia).toEqual({ id: 'parr-1' });
      expect(result.tipoEmisor).toEqual({ id: 'cp-TIPO_EMISOR' });
      expect(result.establecimiento).toEqual({ id: 'est-1' });
      expect(mockEstablecimientoRepo.findOne).toHaveBeenCalledWith({
        where: { uniCodigo: '170150', isEnabled: true },
      });
    });

    it('calcula edad automáticamente si no vienen edad ni unidadEdadPaciente juntas', async () => {
      mockNotificacionRepo.findOne.mockResolvedValue(null);
      mockNotificacionRepo.save.mockImplementation((n) => Promise.resolve(n));
      mockCatalogoPadreService.buscarSubcategoriaPorSimilitud.mockResolvedValue({ id: 'cp-anios' });

      const result = await service.create(
        {
          codigoDhis2Evento: 'EVT-3',
          residenciaPaciente: {},
          fechaNotificacion: new Date('2024-06-15'),
          fechaNacimiento: new Date('2000-06-15'),
        } as any,
        { id: 'p1' } as any,
      );

      expect(result.edad).toBe(24);
      expect(mockCatalogoPadreService.buscarSubcategoriaPorSimilitud).toHaveBeenCalledWith('UNIDAD_EDAD', 'Años');
    });

    it('delega en update() cuando ya existe una notificación con el mismo codigoDhis2Evento', async () => {
      const existente: any = { id: 'n-existente' };
      mockNotificacionRepo.findOne.mockResolvedValue(existente);
      mockNotificacionRepo.save.mockImplementation((n) => Promise.resolve(n));

      const result = await service.create(
        { codigoDhis2Evento: 'EVT-1', residenciaPaciente: {} } as any,
        { id: 'p1' } as any,
      );

      expect(result.id).toBe('n-existente');
    });

    it('lanza error genérico si la búsqueda inicial por codigoDhis2Evento falla', async () => {
      mockNotificacionRepo.findOne.mockRejectedValue(new Error('DB error'));

      await expect(
        service.create({ codigoDhis2Evento: 'EVT-1', residenciaPaciente: {} } as any, { id: 'p1' } as any),
      ).rejects.toThrow('Hubo un problema al crear o actualizar la notificación');
    });
  });

  // ─── findAll / findOne / findByCodeDhis2 ───────────────────────────────────

  describe('findAll', () => {
    it('retorna todas las notificaciones', async () => {
      mockNotificacionRepo.find.mockResolvedValue([{ id: 'n1' }]);
      const result = await service.findAll();
      expect(result).toEqual([{ id: 'n1' }]);
    });
  });

  describe('findOne', () => {
    it('retorna la notificación cuando existe', async () => {
      mockNotificacionRepo.findOne.mockResolvedValue({ id: 'n1' });
      const result = await service.findOne('n1');
      expect(result).toEqual({ id: 'n1' });
    });

    it('lanza EntityNotFoundException cuando no existe', async () => {
      mockNotificacionRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('no-existe')).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('findByCodeDhis2', () => {
    it('retorna la notificación cuando existe', async () => {
      mockNotificacionRepo.findOne.mockResolvedValue({ id: 'n1' });
      const result = await service.findByCodeDhis2('EVT-1');
      expect(result).toEqual({ id: 'n1' });
    });

    it('retorna null cuando no existe', async () => {
      mockNotificacionRepo.findOne.mockResolvedValue(null);
      const result = await service.findByCodeDhis2('no-existe');
      expect(result).toBeNull();
    });
  });

  // ─── findByIdentificacionAndDateRange / findSimilarRecords ─────────────────

  describe('findByIdentificacionAndDateRange', () => {
    it('construye la query con los filtros esperados', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([{ id: 'n1' }]);
      const fi = new Date('2024-01-01');
      const ff = new Date('2024-02-01');

      const result = await service.findByIdentificacionAndDateRange('0102030405', fi, ff);

      expect(mockNotificacionRepo.createQueryBuilder).toHaveBeenCalledWith('notificacion');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('paciente.identificacion = :identificacion', {
        identificacion: '0102030405',
      });
      expect(result).toEqual([{ id: 'n1' }]);
    });
  });

  describe('findSimilarRecords', () => {
    it('calcula rango de +/- 7 días y ejecuta la query', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([{ id: 'n1' }]);

      const result = await service.findSimilarRecords('0102030405', '2024-01-15');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'notificacion.fechaNotificacion >= :fechaInicio',
        expect.objectContaining({ fechaInicio: expect.any(Date) }),
      );
      expect(result).toEqual([{ id: 'n1' }]);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('actualiza los campos principales de la notificación existente', async () => {
      const existente: any = { id: 'n1' };
      mockNotificacionRepo.save.mockImplementation((n) => Promise.resolve(n));

      const result = await service.update(
        existente,
        {
          residenciaPaciente: {},
          fechaAtencion: new Date('2024-01-01'),
          fechaNotificacion: new Date('2024-01-02'),
          edad: 10,
          casoNarrativo: 'narrativa',
          fechaLlenadoFicha: new Date('2024-01-03'),
          codigoDhis2Evento: 'EVT-1',
        } as any,
        { id: 'p1' } as any,
      );

      expect(result.edad).toBe(10);
      expect(result.casoNarrativo).toBe('narrativa');
      expect(result.codigoOrigenNotificacion).toBe('EVT-1');
      expect(result.paciente).toEqual({ id: 'p1' });
    });

    // Antes la profesión solo se asignaba si la notificación YA tenía notificador, cosa que en
    // DHIS2 nunca ocurría porque ese flujo no creaba ninguno: el dato se descartaba en cada
    // importación. Ahora el notificador se crea o actualiza con los datos frescos del origen.
    it('crea el notificador con la profesión reportada en DHIS2', async () => {
      const existente: any = { id: 'n1' };
      mockNotificadorService.createOrUpdate.mockResolvedValue({
        identificacion: 'SIN_ID:JUAN_PEREZ',
        profesion: { id: 'prof-1' },
      });
      mockNotificacionRepo.save.mockImplementation((n) => Promise.resolve(n));

      const result = await service.update(
        existente,
        {
          residenciaPaciente: {},
          profesionNotificadorParam: 'Medico general',
          nombreNotificador: 'Juan Perez',
        } as any,
        { id: 'p1' } as any,
      );

      expect(mockNotificadorService.createOrUpdate).toHaveBeenCalledWith(
        undefined,
        'Medico general',
        'Juan Perez',
      );
      expect(result.notificador.profesion).toEqual({ id: 'prof-1' });
    });

    it('no falla si el registro del notificador lanza error', async () => {
      const existente: any = { id: 'n1' };
      mockNotificadorService.createOrUpdate.mockRejectedValue(new Error('fail'));
      mockNotificacionRepo.save.mockImplementation((n) => Promise.resolve(n));

      await expect(
        service.update(
          existente,
          {
            residenciaPaciente: {},
            profesionNotificadorParam: 'Medico',
            nombreNotificador: 'Juan Perez',
          } as any,
          { id: 'p1' } as any,
        ),
      ).resolves.toBeDefined();
    });
  });

  // ─── calcularEdad ───────────────────────────────────────────────────────────

  describe('calcularEdad', () => {
    it('calcula la edad correctamente cuando ya pasó el cumpleaños', () => {
      const edad = service.calcularEdad(new Date('2024-07-01'), new Date('2000-01-15'));
      expect(edad).toBe(24);
    });

    it('resta un año si el cumpleaños no ha pasado aún', () => {
      const edad = service.calcularEdad(new Date('2024-01-01'), new Date('2000-06-15'));
      expect(edad).toBe(23);
    });
  });

  // ─── calcularEdadUnidadParaGrupoEtario ──────────────────────────────────────

  describe('calcularEdadUnidadParaGrupoEtario', () => {
    it('no convierte cuando la unidad ya es AÑOS', () => {
      const result = service.calcularEdadUnidadParaGrupoEtario(30, 'AÑOS');
      expect(result).toEqual({ edadCalculada: 30, unidadEdadCalculada: 'AÑOS' });
    });

    it('convierte DÉCADA a años (x10)', () => {
      const result = service.calcularEdadUnidadParaGrupoEtario(3, 'DÉCADA');
      expect(result).toEqual({ edadCalculada: 30, unidadEdadCalculada: 'AÑOS' });
    });

    it('convierte SEMANA <= 52 a meses', () => {
      const result = service.calcularEdadUnidadParaGrupoEtario(20, 'SEMANA');
      expect(result.unidadEdadCalculada).toBe('MESES');
    });

    it('convierte MES/MESES > 11 a años', () => {
      const result = service.calcularEdadUnidadParaGrupoEtario(24, 'MESES');
      expect(result).toEqual({ edadCalculada: 2, unidadEdadCalculada: 'AÑOS' });
    });
  });
});
