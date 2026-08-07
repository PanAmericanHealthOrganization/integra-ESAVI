import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { SyncService } from './sync.service';
import { ReglaHomologacion } from 'src/homologator/entity/regla-homologacion.entity';
import { Homologador } from 'src/homologator/entity/homologador.entity';
import { Canton } from '../entity/canton.entity';
import { CatalogoPadre } from '../entity/catalogo-padre.entity';
import { Establecimiento } from '../entity/establecimiento.entity';
import { CausalidadEsavi } from '../entity/causalidad-esavi.entity';
import { DatoEsavi } from '../entity/dato-esavi.entity';
import { DatoVacuna } from '../entity/dato-vacuna.entity';
import { DatoVacunacion } from '../entity/dato-vacunacion.entity';
import { DesenlaceEsavi } from '../entity/desenlace-esavi.entity';
import { GravedadEsavi } from '../entity/gravedad-esavi.entity';
import { Medicamento } from '../entity/medicamento.entity';
import { Notificacion } from '../entity/notificacion.entity';
import { Paciente } from '../entity/paciente.entity';
import { Parametro } from '../entity/parametro.entity';
import { Parroquia } from '../entity/parroquia.entity';
import { Provincia } from '../entity/provincia.entity';
import { Vacunometro } from '../entity/vacunometro.entity';

jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    readFileSync: jest.fn(),
    promises: {
      ...actual.promises,
      readFile: jest.fn(),
    },
  };
});

jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: { sheet_to_json: jest.fn() },
}));

jest.mock('../utils/parametro-crypto.util', () => ({
  encryptValue: jest.fn((v: string) => `ENC(${v})`),
}));

const fs = require('fs');
const xlsx = require('xlsx');

const makeQueryRunner = () => ({
  query: jest.fn().mockResolvedValue(undefined),
  release: jest.fn().mockResolvedValue(undefined),
});

const mockPacienteRepo: any = {};
const mockNotificacionRepo: any = { manager: { connection: { createQueryRunner: jest.fn() } } };
const mockDatoEsaviRepo: any = {};
const mockMedicamentoRepo: any = {};
const mockCausalidadEsaviRepo: any = {};
const mockGravedadEsaviRepo: any = {};
const mockDesenlaceEsaviRepo: any = {};
const mockDatoVacunaRepo: any = {};
const mockDatoVacunacionRepo: any = { manager: { connection: { createQueryRunner: jest.fn() } } };
// El seed ya no escribe la bitácora a mano: delega en SyncService.ejecutarConRegistro.
const mockSyncService: any = {
  ejecutarConRegistro: jest.fn(async (_source: string, _name: string, proceso: any) => {
    const salida = await proceso('seed-sync-id');
    return salida?.resultado;
  }),
};
const mockCatalogoPadreRepo: any = { findOne: jest.fn(), save: jest.fn(), find: jest.fn() };
const mockProvinciaRepo: any = { count: jest.fn(), findOne: jest.fn(), save: jest.fn() };
const mockCantonRepo: any = { count: jest.fn(), findOne: jest.fn(), save: jest.fn(), find: jest.fn() };
const mockParroquiaRepo: any = { count: jest.fn(), findOne: jest.fn(), save: jest.fn() };
const mockEstablecimientoRepo: any = { count: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn(), find: jest.fn() };
const mockHomologadorRepo: any = { findOne: jest.fn(), save: jest.fn() };
const mockReglaHomologacionRepo: any = { findOne: jest.fn(), save: jest.fn() };
const mockVacunometroRepo: any = { insert: jest.fn().mockResolvedValue(undefined) };
const mockParametroRepo: any = { findOne: jest.fn(), save: jest.fn() };

describe('SeedService', () => {
  let service: SeedService;
  const ORIGINAL_ENV = process.env.ENV;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.ENV = ORIGINAL_ENV;

    mockEstablecimientoRepo.create.mockImplementation((data: any) => ({ ...data }));
    mockNotificacionRepo.manager.connection.createQueryRunner.mockReturnValue(makeQueryRunner());
    mockDatoVacunacionRepo.manager.connection.createQueryRunner.mockReturnValue(makeQueryRunner());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: getRepositoryToken(Paciente, 'POSTGRES_INTEGRATOR_DS'), useValue: mockPacienteRepo },
        { provide: getRepositoryToken(Notificacion, 'POSTGRES_INTEGRATOR_DS'), useValue: mockNotificacionRepo },
        { provide: getRepositoryToken(DatoEsavi, 'POSTGRES_INTEGRATOR_DS'), useValue: mockDatoEsaviRepo },
        { provide: getRepositoryToken(Medicamento, 'POSTGRES_INTEGRATOR_DS'), useValue: mockMedicamentoRepo },
        { provide: getRepositoryToken(CausalidadEsavi, 'POSTGRES_INTEGRATOR_DS'), useValue: mockCausalidadEsaviRepo },
        { provide: getRepositoryToken(GravedadEsavi, 'POSTGRES_INTEGRATOR_DS'), useValue: mockGravedadEsaviRepo },
        { provide: getRepositoryToken(DesenlaceEsavi, 'POSTGRES_INTEGRATOR_DS'), useValue: mockDesenlaceEsaviRepo },
        { provide: getRepositoryToken(DatoVacuna, 'POSTGRES_INTEGRATOR_DS'), useValue: mockDatoVacunaRepo },
        { provide: getRepositoryToken(DatoVacunacion, 'POSTGRES_INTEGRATOR_DS'), useValue: mockDatoVacunacionRepo },
        { provide: SyncService, useValue: mockSyncService },
        { provide: getRepositoryToken(CatalogoPadre, 'POSTGRES_INTEGRATOR_DS'), useValue: mockCatalogoPadreRepo },
        { provide: getRepositoryToken(Provincia, 'POSTGRES_INTEGRATOR_DS'), useValue: mockProvinciaRepo },
        { provide: getRepositoryToken(Canton, 'POSTGRES_INTEGRATOR_DS'), useValue: mockCantonRepo },
        { provide: getRepositoryToken(Parroquia, 'POSTGRES_INTEGRATOR_DS'), useValue: mockParroquiaRepo },
        { provide: getRepositoryToken(Establecimiento, 'POSTGRES_INTEGRATOR_DS'), useValue: mockEstablecimientoRepo },
        { provide: getRepositoryToken(Homologador, 'POSTGRES_INTEGRATOR_DS'), useValue: mockHomologadorRepo },
        { provide: getRepositoryToken(ReglaHomologacion, 'POSTGRES_INTEGRATOR_DS'), useValue: mockReglaHomologacionRepo },
        { provide: getRepositoryToken(Vacunometro, 'POSTGRES_INTEGRATOR_DS'), useValue: mockVacunometroRepo },
        { provide: getRepositoryToken(Parametro, 'POSTGRES_INTEGRATOR_DS'), useValue: mockParametroRepo },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
  });

  afterAll(() => {
    process.env.ENV = ORIGINAL_ENV;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── onApplicationBootstrap ─────────────────────────────────────────────────

  describe('onApplicationBootstrap', () => {
    it('ejecuta todas las tareas de siembra en orden', async () => {
      const seedData = jest.spyOn(service, 'seedData').mockResolvedValue(undefined);
      const seedUbicaciones = jest.spyOn(service, 'seedUbicaciones').mockResolvedValue(undefined);
      const loadTipos = jest.spyOn(service as any, 'loadTiposEntidadCatalogoPadre').mockResolvedValue(undefined);
      const loadEstablecimientos = jest.spyOn(service as any, 'loadEstablecimientosFromCSV').mockResolvedValue(undefined);
      const migrarTipoEmisor = jest.spyOn(service as any, 'migrarTipoEmisor').mockResolvedValue(undefined);
      const seedParametrosDev = jest.spyOn(service as any, 'seedParametrosDev').mockResolvedValue(undefined);

      await service.onApplicationBootstrap();

      expect(seedData).toHaveBeenCalledTimes(1);
      expect(seedUbicaciones).toHaveBeenCalledTimes(1);
      expect(loadTipos).toHaveBeenCalledTimes(1);
      expect(loadEstablecimientos).toHaveBeenCalledTimes(1);
      expect(migrarTipoEmisor).toHaveBeenCalledTimes(1);
      expect(seedParametrosDev).toHaveBeenCalledTimes(1);
    });
  });

  // ─── seedParametrosDev ──────────────────────────────────────────────────────

  describe('seedParametrosDev', () => {
    it('no hace nada si ENV no es DEV', async () => {
      process.env.ENV = 'PROD';
      await (service as any).seedParametrosDev();
      expect(mockParametroRepo.findOne).not.toHaveBeenCalled();
      expect(mockParametroRepo.save).not.toHaveBeenCalled();
    });

    it('inserta los parámetros dummy faltantes y encripta los sensibles cuando ENV=DEV', async () => {
      process.env.ENV = 'DEV';
      mockParametroRepo.findOne.mockResolvedValue(null);
      mockParametroRepo.save.mockResolvedValue({});

      await (service as any).seedParametrosDev();

      expect(mockParametroRepo.save).toHaveBeenCalled();
      const savedEncrypted = mockParametroRepo.save.mock.calls.find((c: any[]) => c[0].clave === 'DHIS2_USER_KEY');
      expect(savedEncrypted[0].valor).toBe('ENC(CAMBIAR_DHIS2_USER_KEY)');
      const savedPlain = mockParametroRepo.save.mock.calls.find((c: any[]) => c[0].clave === 'DHIS2_URL');
      expect(savedPlain[0].valor).toBe('https://dev-ops-gss.msp.gob.ec');
    });

    it('omite los parámetros que ya existen', async () => {
      process.env.ENV = 'dev';
      mockParametroRepo.findOne.mockImplementation(({ where }: any) =>
        Promise.resolve(where.clave === 'DHIS2_URL' ? { clave: 'DHIS2_URL' } : null),
      );
      mockParametroRepo.save.mockResolvedValue({});

      await (service as any).seedParametrosDev();

      const savedDhis2Url = mockParametroRepo.save.mock.calls.find((c: any[]) => c[0].clave === 'DHIS2_URL');
      expect(savedDhis2Url).toBeUndefined();
    });
  });

  // ─── seedData ───────────────────────────────────────────────────────────────

  describe('seedData', () => {
    it('carga catálogo padre y homologador sexo', async () => {
      const loadCatalogo = jest.spyOn(service as any, 'loadCatalogoPadreFromCSV').mockResolvedValue(undefined);
      const loadHomologador = jest.spyOn(service as any, 'loadHomologadorSexoVigiflow').mockResolvedValue(undefined);

      await service.seedData();

      expect(loadCatalogo).toHaveBeenCalledTimes(1);
      expect(loadHomologador).toHaveBeenCalledTimes(1);
    });
  });

  // ─── cleanData ──────────────────────────────────────────────────────────────

  describe('cleanData', () => {
    it('trunca las tablas dentro de una transacción de replicación deshabilitada', async () => {
      const qr = makeQueryRunner();
      mockDatoVacunacionRepo.manager.connection.createQueryRunner.mockReturnValue(qr);

      await service.cleanData();

      expect(qr.query).toHaveBeenCalledWith('SET session_replication_role = replica;');
      expect(qr.query).toHaveBeenCalledWith('SET session_replication_role = DEFAULT;');
      expect(qr.query.mock.calls.some((c: any[]) => c[0].includes('TR_PACIENTE'))).toBe(true);
    });

    it('relanza el error si alguna consulta falla', async () => {
      const qr = makeQueryRunner();
      qr.query.mockRejectedValueOnce(new Error('fallo truncando'));
      mockDatoVacunacionRepo.manager.connection.createQueryRunner.mockReturnValue(qr);

      await expect(service.cleanData()).rejects.toThrow('fallo truncando');
    });
  });

  // ─── loadCatalogoPadreFromCSV ───────────────────────────────────────────────

  describe('loadCatalogoPadreFromCSV', () => {
    it('inserta registros top-level e hijos desde el CSV', async () => {
      fs.readFileSync.mockReturnValue(
        'codigo,codigo_padre,descripcion,codigo_homologado\n' +
          'GENERO,,Genero,\n' +
          'HOMBRE,GENERO,Hombre,\n',
      );
      mockCatalogoPadreRepo.findOne.mockResolvedValue(null);
      mockCatalogoPadreRepo.save.mockImplementation((data: any) => Promise.resolve({ id: 'cp-' + data.codigo, ...data }));

      await (service as any).loadCatalogoPadreFromCSV();

      expect(mockCatalogoPadreRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ codigo: 'GENERO', padre: null }),
      );
      expect(mockCatalogoPadreRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ codigo: 'HOMBRE' }),
      );
    });

    it('omite registros ya existentes', async () => {
      fs.readFileSync.mockReturnValue('codigo,codigo_padre,descripcion,codigo_homologado\nGENERO,,Genero,\n');
      mockCatalogoPadreRepo.findOne.mockResolvedValue({ id: 'ya-existe' });

      await (service as any).loadCatalogoPadreFromCSV();

      expect(mockCatalogoPadreRepo.save).not.toHaveBeenCalled();
    });

    it('no lanza si falla la lectura del CSV (error capturado internamente)', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('archivo no encontrado');
      });

      await expect((service as any).loadCatalogoPadreFromCSV()).resolves.toBeUndefined();
    });
  });

  // ─── seedUbicaciones (provincias / cantones / parroquias) ──────────────────

  describe('seedUbicaciones', () => {
    beforeEach(() => {
      fs.readFileSync.mockImplementation((filePath: string) => {
        if (filePath.includes('provincias_ecuador.csv')) {
          return 'header\nAzuay (01)\nBolivar (02)\n';
        }
        if (filePath.includes('cantones_dhis2_ecuador.csv')) {
          return 'header\nCuenca (0101)\n';
        }
        if (filePath.includes('parroquias_dhis2_ecuador.csv')) {
          return 'header\nBaños (010150)\n';
        }
        return '';
      });
    });

    it('omite la carga de provincias si ya hay >= 20 registros', async () => {
      mockProvinciaRepo.count.mockResolvedValue(24);
      mockCantonRepo.count.mockResolvedValue(300);
      mockParroquiaRepo.count.mockResolvedValue(1500);
      mockCantonRepo.find.mockResolvedValue([]);

      await service.seedUbicaciones();

      expect(mockProvinciaRepo.save).not.toHaveBeenCalled();
    });

    it('carga provincias, cantones y parroquias cuando faltan registros', async () => {
      mockProvinciaRepo.count.mockResolvedValue(0);
      mockProvinciaRepo.save.mockResolvedValue({});
      // seedProvincias corre primero (2 filas del CSV: Azuay y Bolivar, ninguna existe
      // aún) y luego seedCantones reutiliza el mismo repositorio para resolver la
      // provincia del cantón por su código: por eso las 2 primeras resoluciones
      // ("once") cubren la fase de provincias y la implementación por defecto cubre
      // la fase posterior de cantones.
      mockProvinciaRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockImplementation(({ where }: any) =>
          Promise.resolve(where.codigo === '01' ? { id: 'prov-01', codigo: '01' } : null),
        );

      mockCantonRepo.count.mockResolvedValue(0);
      mockCantonRepo.save.mockResolvedValue({});
      // Igual que con provincias: la 1ra resolución cubre la verificación de
      // existencia dentro de seedCantones (no existe aún) y la implementación por
      // defecto cubre la fase posterior de seedParroquias (busca el cantón padre).
      mockCantonRepo.findOne
        .mockResolvedValueOnce(null)
        .mockImplementation(({ where }: any) =>
          Promise.resolve(where.codigo === '0101' ? { id: 'canton-0101', codigo: '0101', nombre: 'Cuenca' } : null),
        );

      mockParroquiaRepo.count.mockResolvedValue(0);
      mockParroquiaRepo.findOne.mockResolvedValue(null);
      mockParroquiaRepo.save.mockResolvedValue({});
      mockCantonRepo.find.mockResolvedValue([{ id: 'canton-0101', codigo: '0101', nombre: 'Cuenca' }]);

      await service.seedUbicaciones();

      expect(mockProvinciaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ codigo: '01', nombre: 'Azuay' }),
      );
      expect(mockCantonRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ codigo: '0101', nombre: 'Cuenca' }),
      );
      expect(mockParroquiaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ codigo: '010150' }),
      );
      // parroquia "Desconocido" por cada cantón existente
      expect(mockParroquiaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ codigo: '010199', nombre: 'Desconocido-Cuenca' }),
      );
    });

    it('omite cantón si no encuentra la provincia asociada', async () => {
      mockProvinciaRepo.count.mockResolvedValue(20);
      mockCantonRepo.count.mockResolvedValue(0);
      mockCantonRepo.findOne.mockResolvedValue(null);
      mockProvinciaRepo.findOne.mockResolvedValue(null);
      mockParroquiaRepo.count.mockResolvedValue(1400);
      mockCantonRepo.find.mockResolvedValue([]);

      await service.seedUbicaciones();

      expect(mockCantonRepo.save).not.toHaveBeenCalled();
    });

    it('continúa sin lanzar si falla la lectura de algún CSV', async () => {
      mockProvinciaRepo.count.mockResolvedValue(0);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('csv roto');
      });
      mockCantonRepo.count.mockResolvedValue(200);
      mockParroquiaRepo.count.mockResolvedValue(1400);

      await expect(service.seedUbicaciones()).resolves.toBeUndefined();
    });
  });

  // ─── loadHomologadorSexoVigiflow ────────────────────────────────────────────

  describe('loadHomologadorSexoVigiflow', () => {
    it('crea el homologador y las reglas Sexo cuando no existen', async () => {
      mockHomologadorRepo.findOne.mockResolvedValue(null);
      mockHomologadorRepo.save.mockResolvedValue({ id: 'hom-1' });
      mockCatalogoPadreRepo.findOne.mockImplementation(({ where }: any) => {
        const map: any = { HOMBRE: { id: 'h1' }, MUJER: { id: 'm1' }, OTRO: { id: 'o1' } };
        return Promise.resolve(map[where.codigo] ?? null);
      });
      mockReglaHomologacionRepo.findOne.mockResolvedValue(null);
      mockReglaHomologacionRepo.save.mockResolvedValue({});

      await (service as any).loadHomologadorSexoVigiflow();

      expect(mockHomologadorRepo.save).toHaveBeenCalledTimes(1);
      // 7 reglas definidas en el código (VIGIFLOW x3, DHIS2 x4)
      expect(mockReglaHomologacionRepo.save).toHaveBeenCalledTimes(7);
    });

    it('omite la carga de reglas si falta HOMBRE/MUJER/OTRO en el catálogo', async () => {
      mockHomologadorRepo.findOne.mockResolvedValue({ id: 'hom-1', targetType: 'STRING' });
      mockCatalogoPadreRepo.findOne.mockResolvedValue(null);

      await (service as any).loadHomologadorSexoVigiflow();

      expect(mockReglaHomologacionRepo.findOne).not.toHaveBeenCalled();
    });

    it('corrige el targetValue de una regla existente si difiere', async () => {
      mockHomologadorRepo.findOne.mockResolvedValue({ id: 'hom-1', targetType: 'STRING' });
      mockCatalogoPadreRepo.findOne.mockImplementation(({ where }: any) => {
        const map: any = { HOMBRE: { id: 'h1' }, MUJER: { id: 'm1' }, OTRO: { id: 'o1' } };
        return Promise.resolve(map[where.codigo] ?? null);
      });
      mockReglaHomologacionRepo.findOne.mockResolvedValue({ id: 'regla-1', targetValue: 'valor-viejo' });
      mockReglaHomologacionRepo.save.mockResolvedValue({});

      await (service as any).loadHomologadorSexoVigiflow();

      expect(mockReglaHomologacionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ targetValue: expect.any(String) }),
      );
    });
  });

  // ─── loadTiposEntidadCatalogoPadre ──────────────────────────────────────────

  describe('loadTiposEntidadCatalogoPadre', () => {
    it('omite la carga si ya existe el padre ENTIDAD', async () => {
      mockCatalogoPadreRepo.findOne.mockResolvedValue({ id: 'entidad-padre' });

      await (service as any).loadTiposEntidadCatalogoPadre();

      expect(mockCatalogoPadreRepo.save).not.toHaveBeenCalled();
    });

    it('crea el padre ENTIDAD y los tipos hijos cuando no existen', async () => {
      mockCatalogoPadreRepo.findOne.mockResolvedValue(null);
      mockCatalogoPadreRepo.save.mockImplementation((data: any) => Promise.resolve({ id: 'nuevo-' + data.codigo, ...data }));

      await (service as any).loadTiposEntidadCatalogoPadre();

      expect(mockCatalogoPadreRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ codigo: 'ENTIDAD', nombre: 'Entidad' }),
      );
      // Se intenta insertar cada uno de los 25 tipos definidos
      expect(mockCatalogoPadreRepo.save.mock.calls.length).toBeGreaterThan(20);
    });
  });

  // ─── loadEstablecimientosFromCSV ────────────────────────────────────────────

  describe('loadEstablecimientosFromCSV', () => {
    it('omite la carga si ya existen establecimientos habilitados', async () => {
      mockEstablecimientoRepo.count.mockResolvedValue(5);

      await (service as any).loadEstablecimientosFromCSV();

      expect(xlsx.read).not.toHaveBeenCalled();
    });

    it('inserta establecimientos válidos y resuelve parroquia/tipoEntidad', async () => {
      mockEstablecimientoRepo.count.mockResolvedValue(0);
      fs.promises.readFile.mockResolvedValue(Buffer.from('contenido'));
      xlsx.read.mockReturnValue({ Sheets: { Hoja1: {} }, SheetNames: ['Hoja1'] });
      xlsx.utils.sheet_to_json.mockReturnValue([
        {
          UNI_CODIGO: '170150',
          UNI_NOMBRE: 'Hospital Central',
          UNI_DIRECCION: 'Calle 1',
          UNI_TELEFONO: '022222222',
          PAR_CODIGO: '170150',
          TIPO_ENTIDAD: 'MSP',
          MAIL: 'a@b.com',
        },
        { UNI_CODIGO: '', UNI_NOMBRE: '' },
      ]);
      mockEstablecimientoRepo.findOne.mockResolvedValue(null);
      mockParroquiaRepo.findOne.mockResolvedValue({ id: 'parr-1' });
      mockCatalogoPadreRepo.findOne.mockResolvedValue({ id: 'tipo-msp' });
      mockEstablecimientoRepo.save.mockResolvedValue({});

      await (service as any).loadEstablecimientosFromCSV();

      expect(mockEstablecimientoRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ uniCodigo: '170150' }),
      );
      expect(mockEstablecimientoRepo.save).toHaveBeenCalledTimes(1);
    });

    it('no lanza si falla la lectura del archivo Excel', async () => {
      mockEstablecimientoRepo.count.mockResolvedValue(0);
      fs.promises.readFile.mockRejectedValue(new Error('no existe el archivo'));

      await expect((service as any).loadEstablecimientosFromCSV()).resolves.toBeUndefined();
    });
  });

  // ─── seedVacunometro ────────────────────────────────────────────────────────

  describe('seedVacunometro', () => {
    it('usa unicodigos reales cuando existen establecimientos', async () => {
      mockEstablecimientoRepo.find.mockResolvedValue([{ uniCodigo: '170150' }, { uniCodigo: '170151' }]);

      const result = await service.seedVacunometro(5, 30);

      expect(mockVacunometroRepo.insert).toHaveBeenCalled();
      expect(result.insertados).toBe(5);
    });

    it('usa códigos sintéticos cuando no hay establecimientos', async () => {
      mockEstablecimientoRepo.find.mockResolvedValue([]);

      const result = await service.seedVacunometro(3, 10);

      expect(mockVacunometroRepo.insert).toHaveBeenCalled();
      expect(result.insertados).toBe(3);
    });
  });

  // ─── seedSimulacionVacunacionDiaria ─────────────────────────────────────────

  describe('seedSimulacionVacunacionDiaria', () => {
    it('simula vacunación diaria para todos los establecimientos', async () => {
      mockEstablecimientoRepo.find.mockResolvedValue([{ uniCodigo: '170150' }]);

      const result = await service.seedSimulacionVacunacionDiaria(2);

      expect(result.establecimientos).toBe(1);
      expect(result.dias).toBe(2);
      expect(mockVacunometroRepo.insert).toHaveBeenCalled();
    });

    it('lanza error si no existen establecimientos registrados', async () => {
      mockEstablecimientoRepo.find.mockResolvedValue([]);

      await expect(service.seedSimulacionVacunacionDiaria(1)).rejects.toThrow(
        'No existen establecimientos registrados',
      );
    });
  });

  // ─── truncateNotificacion ───────────────────────────────────────────────────

  describe('truncateNotificacion', () => {
    it('trunca TR_NOTIFICACION en cascada', async () => {
      const qr = makeQueryRunner();
      mockNotificacionRepo.manager.connection.createQueryRunner.mockReturnValue(qr);

      await service.truncateNotificacion();

      expect(qr.query).toHaveBeenCalledWith('TRUNCATE TABLE "DHI_ESAVI"."TR_NOTIFICACION" CASCADE;');
      expect(qr.release).toHaveBeenCalledTimes(1);
    });

    it('relanza el error y libera el queryRunner si falla', async () => {
      const qr = makeQueryRunner();
      qr.query.mockRejectedValueOnce(new Error('fallo truncando notificacion'));
      mockNotificacionRepo.manager.connection.createQueryRunner.mockReturnValue(qr);

      await expect(service.truncateNotificacion()).rejects.toThrow('fallo truncando notificacion');
      expect(qr.release).toHaveBeenCalledTimes(1);
    });
  });

  // ─── cleanTRTables ──────────────────────────────────────────────────────────

  describe('cleanTRTables', () => {
    it('no hace nada si no encuentra tablas', async () => {
      const qr = makeQueryRunner();
      qr.query.mockResolvedValue([]);
      mockDatoVacunacionRepo.manager.connection.createQueryRunner.mockReturnValue(qr);

      await service.cleanTRTables();

      expect(qr.query).toHaveBeenCalledTimes(1);
      expect(qr.release).toHaveBeenCalledTimes(1);
    });

    it('trunca todas las tablas encontradas de los esquemas no excluidos', async () => {
      const qr = makeQueryRunner();
      qr.query.mockImplementation((sql: string) => {
        if (sql.includes('information_schema.tables')) {
          return Promise.resolve([{ table_schema: 'DHI_ESAVI', table_name: 'TR_PACIENTE' }]);
        }
        return Promise.resolve(undefined);
      });
      mockDatoVacunacionRepo.manager.connection.createQueryRunner.mockReturnValue(qr);

      await service.cleanTRTables();

      expect(qr.query).toHaveBeenCalledWith(expect.stringContaining('TRUNCATE TABLE "DHI_ESAVI"."TR_PACIENTE"'));
    });

    it('relanza el error y libera el queryRunner si falla', async () => {
      const qr = makeQueryRunner();
      qr.query.mockRejectedValueOnce(new Error('fallo listando tablas'));
      mockDatoVacunacionRepo.manager.connection.createQueryRunner.mockReturnValue(qr);

      await expect(service.cleanTRTables()).rejects.toThrow('fallo listando tablas');
      expect(qr.release).toHaveBeenCalledTimes(1);
    });
  });

  // ─── migrarTipoEmisor ───────────────────────────────────────────────────────

  describe('migrarTipoEmisor', () => {
    it('omite la migración si la columna legada no existe', async () => {
      const qr = makeQueryRunner();
      qr.query.mockResolvedValueOnce([{ exists: false }]);
      mockNotificacionRepo.manager.connection.createQueryRunner.mockReturnValue(qr);

      await (service as any).migrarTipoEmisor();

      expect(mockCatalogoPadreRepo.find).not.toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalledTimes(1);
    });

    it('omite la migración si no hay registros pendientes', async () => {
      const qr = makeQueryRunner();
      qr.query.mockResolvedValueOnce([{ exists: true }]).mockResolvedValueOnce([{ total: '0' }]);
      mockNotificacionRepo.manager.connection.createQueryRunner.mockReturnValue(qr);

      await (service as any).migrarTipoEmisor();

      expect(mockCatalogoPadreRepo.find).not.toHaveBeenCalled();
    });

    it('migra los registros pendientes encontrando la mejor coincidencia por similitud', async () => {
      const qr = makeQueryRunner();
      qr.query.mockImplementation((sql: string) => {
        if (sql.includes('information_schema.columns')) return Promise.resolve([{ exists: true }]);
        if (sql.includes('COUNT(*) AS total')) return Promise.resolve([{ total: '2' }]);
        if (sql.includes('SELECT "ID", "TIPO_EMISOR"')) {
          return Promise.resolve([
            { ID: '1', TIPO_EMISOR: '1' },
            { ID: '2', TIPO_EMISOR: 'Sin match' },
          ]);
        }
        return Promise.resolve(undefined);
      });
      mockNotificacionRepo.manager.connection.createQueryRunner.mockReturnValue(qr);
      mockCatalogoPadreRepo.find.mockResolvedValue([{ id: 'te-1', nombre: 'Profesional de la salud' }]);

      await (service as any).migrarTipoEmisor();

      expect(qr.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE "DHI_ESAVI"."TR_NOTIFICACION"'),
        ['te-1', '1'],
      );
    });

    it('no lanza si ocurre un error consultando la base de datos', async () => {
      const qr = makeQueryRunner();
      qr.query.mockRejectedValueOnce(new Error('fallo de conexión'));
      mockNotificacionRepo.manager.connection.createQueryRunner.mockReturnValue(qr);

      await expect((service as any).migrarTipoEmisor()).resolves.toBeUndefined();
      expect(qr.release).toHaveBeenCalledTimes(1);
    });
  });
});
