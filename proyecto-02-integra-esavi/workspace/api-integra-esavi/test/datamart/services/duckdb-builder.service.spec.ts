import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DuckDbBuilderService } from 'src/datamart/services/duckdb-builder.service';
import { DuckDBInstance } from '@duckdb/node-api';
import { promises as fs } from 'fs';
import { buildTransformStatements } from 'src/datamart/sql/datamart-sql';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    unlink: jest.fn(),
    rename: jest.fn(),
  },
}));

jest.mock('@duckdb/node-api', () => ({
  DuckDBInstance: {
    create: jest.fn(),
  },
}));

jest.mock('src/datamart/sql/datamart-sql', () => ({
  buildTransformStatements: jest.fn(),
}));

const mockConfigService = {
  get: jest.fn(),
};

describe('DuckDbBuilderService', () => {
  let service: DuckDbBuilderService;

  const makeConn = (overrides: Partial<Record<string, any>> = {}) => ({
    run: jest.fn().mockResolvedValue(undefined),
    runAndReadAll: jest.fn().mockResolvedValue({
      getRowObjects: () => [
        { tabla: 'notificaciones', filas: 10 },
        { tabla: 'pacientes', filas: 5 },
      ],
    }),
    disconnectSync: jest.fn(),
    ...overrides,
  });

  const makeInstance = (conn: any) => ({
    connect: jest.fn().mockResolvedValue(conn),
    closeSync: jest.fn(),
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((_key: string) => undefined);
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);
    (fs.rename as jest.Mock).mockResolvedValue(undefined);
    (buildTransformStatements as jest.Mock).mockReturnValue(['SELECT 1', 'SELECT 2']);

    const module: TestingModule = await Test.createTestingModule({
      providers: [DuckDbBuilderService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<DuckDbBuilderService>(DuckDbBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getOutputPath ──────────────────────────────────────────────────────

  describe('getOutputPath', () => {
    it('usa la ruta por defecto cuando no hay configuración', () => {
      mockConfigService.get.mockReturnValue(undefined);
      const result = service.getOutputPath();
      expect(result).toContain('esavi.duckdb');
    });

    it('usa la ruta configurada cuando existe DATAMART_DUCKDB_PATH', () => {
      mockConfigService.get.mockImplementation((key: string) =>
        key === 'DATAMART_DUCKDB_PATH' ? 'custom/salida.duckdb' : undefined,
      );
      const result = service.getOutputPath();
      expect(result).toContain('salida.duckdb');
    });
  });

  // ─── build (camino feliz) ───────────────────────────────────────────────

  describe('build', () => {
    it('construye el archivo DuckDB exitosamente y calcula los conteos de filas', async () => {
      const conn = makeConn();
      const instance = makeInstance(conn);
      (DuckDBInstance.create as jest.Mock).mockResolvedValue(instance);

      const result = await service.build();

      expect(result.ok).toBe(true);
      expect(result.rowCounts).toEqual({ notificaciones: 10, pacientes: 5 });
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.rename).toHaveBeenCalledTimes(1);
      expect(conn.disconnectSync).toHaveBeenCalledTimes(1);
      expect(instance.closeSync).toHaveBeenCalledTimes(1);
      // 1 INSTALL + 1 LOAD + 1 ATTACH + 2 statements + 1 DETACH = 6 llamadas a run
      expect(conn.run).toHaveBeenCalledTimes(6);
    });

    it('continúa con LOAD aunque INSTALL postgres falle (extensión ya instalada)', async () => {
      const conn = makeConn();
      conn.run.mockImplementation((sql: string) => {
        if (sql === 'INSTALL postgres') {
          return Promise.reject(new Error('no network'));
        }
        return Promise.resolve(undefined);
      });
      const instance = makeInstance(conn);
      (DuckDBInstance.create as jest.Mock).mockResolvedValue(instance);

      const result = await service.build();

      expect(result.ok).toBe(true);
      expect(conn.run).toHaveBeenCalledWith('LOAD postgres');
    });

    it('retorna ok:false y limpia el temporal cuando la creación de la instancia falla', async () => {
      (DuckDBInstance.create as jest.Mock).mockRejectedValue(new Error('no se pudo crear el archivo'));

      const result = await service.build();

      expect(result.ok).toBe(false);
      expect(result.error).toContain('no se pudo crear el archivo');
      // safeUnlink se invoca al inicio y de nuevo en el catch
      expect(fs.unlink).toHaveBeenCalledTimes(2);
    });

    it('retorna ok:false sin lanzar cuando falla un paso SQL de transformación y el cierre de recursos también falla', async () => {
      const conn = makeConn({
        disconnectSync: jest.fn(() => {
          throw new Error('ya estaba cerrado');
        }),
      });
      conn.run.mockImplementation((sql: string) => {
        if (sql === 'SELECT 1') {
          return Promise.reject(new Error('fallo en transformación'));
        }
        return Promise.resolve(undefined);
      });
      const instance = makeInstance(conn);
      instance.closeSync.mockImplementation(() => {
        throw new Error('ya estaba cerrada');
      });
      (DuckDBInstance.create as jest.Mock).mockResolvedValue(instance);

      const result = await service.build();

      expect(result.ok).toBe(false);
      expect(result.error).toContain('fallo en transformación');
      expect(fs.rename).not.toHaveBeenCalled();
    });

    it('ignora el error si el archivo temporal no existía al momento de limpiarlo (safeUnlink)', async () => {
      (fs.unlink as jest.Mock).mockRejectedValue(new Error('ENOENT'));
      const conn = makeConn();
      const instance = makeInstance(conn);
      (DuckDBInstance.create as jest.Mock).mockResolvedValue(instance);

      const result = await service.build();

      expect(result.ok).toBe(true);
    });
  });
});
