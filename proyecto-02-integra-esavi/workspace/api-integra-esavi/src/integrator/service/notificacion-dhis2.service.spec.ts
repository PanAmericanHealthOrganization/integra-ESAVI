import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificacionDhis2Service } from './notificacion-dhis2.service';
import { Notificacion } from '../entity/notificacion.entity';
import { Parroquia } from '../entity/parroquia.entity';
import { EstablecimientosService } from './establecimientos.service';
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

const mockEstablecimientosService = {
  findByCodigoONombre: jest.fn(),
};

const mockNotificadorService = {
  buscarProfesionPorNombre: jest.fn(),
  createOrUpdate: jest.fn(),
};

const mockCatalogoPadreService = {
  buscarSubcategoriaPorSimilitud: jest.fn(),
  findByCodigo: jest.fn(),
};

describe('NotificacionDhis2Service', () => {
  let service: NotificacionDhis2Service;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCatalogoPadreService.findByCodigo.mockImplementation((codigo: string) =>
      Promise.resolve({ id: `cp-${codigo}`, codigo }),
    );
    mockEstablecimientosService.findByCodigoONombre.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificacionDhis2Service,
        { provide: getRepositoryToken(Notificacion, 'POSTGRES_INTEGRATOR_DS'), useValue: mockNotificacionRepo },
        { provide: getRepositoryToken(Parroquia, 'POSTGRES_INTEGRATOR_DS'), useValue: mockParroquiaRepo },
        { provide: EstablecimientosService, useValue: mockEstablecimientosService },
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
      mockEstablecimientosService.findByCodigoONombre.mockResolvedValue({ id: 'est-1' });

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
      expect(mockEstablecimientosService.findByCodigoONombre).toHaveBeenCalledWith('170150', null);
      // La residencia venía declarada en el formulario, y así queda marcada.
      expect(result.origenResidencia).toEqual({ id: 'cp-RESIDENCIA_DECLARADA', codigo: 'RESIDENCIA_DECLARADA' });
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

  // ─── cascada de residencia ──────────────────────────────────────────────────

  /*
   * La residencia declarada llega sólo cuando quien notifica rellena los tres data elements
   * de provincia/cantón/parroquia. Cuando no, se deriva del establecimiento —que es una
   * aproximación—, y por eso cada valor queda marcado con su procedencia.
   */
  describe('resolución de la residencia', () => {
    const parroquiaDelEstablecimiento = { codigo: '040651', nombre: 'Mariscal sucre' };
    const establecimientoConParroquia = {
      id: 'est-huaca',
      uniCodigo: '002526',
      uniNombre: 'Dispensario popular huaqueña',
      parroquiaResidencia: parroquiaDelEstablecimiento,
    };

    const crear = (dto: Record<string, any>) =>
      service.create({ codigoDhis2Evento: 'EVT-RES', residenciaPaciente: {}, ...dto } as any, { id: 'p1' } as any);

    beforeEach(() => {
      mockNotificacionRepo.findOne.mockResolvedValue(null);
      mockNotificacionRepo.save.mockImplementation((n) => Promise.resolve(n));
    });

    it('deriva la residencia del establecimiento de atención cuando no viene declarada', async () => {
      mockEstablecimientosService.findByCodigoONombre.mockResolvedValue(establecimientoConParroquia);

      const result = await crear({ codigoUnidadSalud: '002526' });

      expect(result.parroquiaResidencia).toEqual(parroquiaDelEstablecimiento);
      expect(result.establecimiento).toEqual(establecimientoConParroquia);
      expect(result.origenResidencia.codigo).toBe('RESIDENCIA_ESTABLECIMIENTO_ATENCION');
    });

    /*
     * El caso que motivó todo esto: sin data elements de residencia y sin «Unicódigo», lo
     * único que queda es la unidad organizativa que realizó la inscripción, que DHIS2 sí
     * entrega siempre y que hasta ahora se extraía y se tiraba.
     */
    it('deriva la residencia de la unidad organizativa de inscripción como último recurso', async () => {
      mockEstablecimientosService.findByCodigoONombre.mockImplementation((codigo: string, nombre: string) =>
        Promise.resolve(codigo === '002526' || nombre === 'Dispensario Popular Huaqueña' ? establecimientoConParroquia : null),
      );

      const result = await crear({
        organizacionUnitCode: '002526',
        organizacionNotificador: 'Dispensario Popular Huaqueña',
      });

      expect(result.parroquiaResidencia).toEqual(parroquiaDelEstablecimiento);
      expect(result.origenResidencia.codigo).toBe('RESIDENCIA_UNIDAD_INSCRIPCION');
    });

    it('prefiere el establecimiento de atención sobre la unidad de inscripción', async () => {
      const deAtencion = { id: 'est-atencion', parroquiaResidencia: { codigo: '170150' } };
      mockEstablecimientosService.findByCodigoONombre.mockImplementation((codigo: string) =>
        Promise.resolve(codigo === '170150' ? deAtencion : establecimientoConParroquia),
      );

      const result = await crear({ codigoUnidadSalud: '170150', organizacionUnitCode: '002526' });

      expect(result.parroquiaResidencia).toEqual({ codigo: '170150' });
      expect(result.origenResidencia.codigo).toBe('RESIDENCIA_ESTABLECIMIENTO_ATENCION');
    });

    /*
     * Un establecimiento sin parroquia no sirve para derivar residencia, pero sigue siendo el
     * establecimiento de la notificación: se conserva y se pasa al siguiente escalón.
     */
    it('sigue a la unidad de inscripción si el establecimiento de atención no tiene parroquia', async () => {
      const sinParroquia = { id: 'est-sin-parr', parroquiaResidencia: null };
      mockEstablecimientosService.findByCodigoONombre.mockImplementation((codigo: string) =>
        Promise.resolve(codigo === '999999' ? sinParroquia : establecimientoConParroquia),
      );

      const result = await crear({ codigoUnidadSalud: '999999', organizacionUnitCode: '002526' });

      expect(result.parroquiaResidencia).toEqual(parroquiaDelEstablecimiento);
      expect(result.establecimiento).toEqual(sinParroquia);
      expect(result.origenResidencia.codigo).toBe('RESIDENCIA_UNIDAD_INSCRIPCION');
    });

    it('marca SIN_DATO cuando ningún escalón resuelve', async () => {
      mockEstablecimientosService.findByCodigoONombre.mockResolvedValue(null);

      const result = await crear({ codigoUnidadSalud: 'no-existe' });

      expect(result.parroquiaResidencia).toBeUndefined();
      expect(result.origenResidencia.codigo).toBe('RESIDENCIA_SIN_DATO');
    });

    it('no consulta establecimientos cuando no hay ni código ni nombre', async () => {
      await crear({});
      expect(mockEstablecimientosService.findByCodigoONombre).not.toHaveBeenCalled();
    });

    /*
     * En una reimportación, un origen que dejó de traer el dato no debe borrar una residencia
     * que ya se había resuelto bien. Sólo se escribe lo que se resolvió.
     */
    it('no borra la residencia existente cuando la reimportación no resuelve nada', async () => {
      const existente: any = {
        id: 'n-existente',
        parroquiaResidencia: { codigo: '170150' },
        establecimiento: { id: 'est-previo' },
      };
      mockNotificacionRepo.findOne.mockResolvedValue(existente);
      mockEstablecimientosService.findByCodigoONombre.mockResolvedValue(null);

      const result = await service.update(existente, { residenciaPaciente: {} } as any, { id: 'p1' } as any);

      expect(result.parroquiaResidencia).toEqual({ codigo: '170150' });
      expect(result.establecimiento).toEqual({ id: 'est-previo' });
    });

    it('consulta el catálogo de procedencia una sola vez por código', async () => {
      mockEstablecimientosService.findByCodigoONombre.mockResolvedValue(establecimientoConParroquia);

      await crear({ codigoUnidadSalud: '002526' });
      await crear({ codigoUnidadSalud: '002526' });

      const llamadas = mockCatalogoPadreService.findByCodigo.mock.calls.filter(
        ([codigo]) => codigo === 'RESIDENCIA_ESTABLECIMIENTO_ATENCION',
      );
      expect(llamadas).toHaveLength(1);
    });
  });
});
