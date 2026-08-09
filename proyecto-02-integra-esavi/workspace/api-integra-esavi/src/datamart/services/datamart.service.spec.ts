import {ConfigService} from '@nestjs/config';
import {Test,TestingModule} from '@nestjs/testing';
import {SyncSource} from 'src/integrator/entity';
import {SyncService} from 'src/integrator/service/sync.service';
import {DatamartBuildResult} from '../datamart.constants';
import {DatamartService} from './datamart.service';
import {DuckDbBuilderService} from './duckdb-builder.service';

const RUTA = '/tmp/esavi.duckdb';

const resultadoOk = (): DatamartBuildResult => ({
  ok: true,
  outputPath: RUTA,
  startedAt: new Date().toISOString(),
  finishedAt: new Date().toISOString(),
  durationMs: 10,
  rowCounts: { datos_procesados: 5 },
});

describe('DatamartService', () => {
  let service: DatamartService;
  let build: jest.Mock;
  let ejecutarConRegistro: jest.Mock;

  beforeEach(async () => {
    build = jest.fn().mockResolvedValue(resultadoOk());
    // Réplica fiel del contrato real: ejecuta el proceso y propaga lo que lance.
    ejecutarConRegistro = jest.fn(async (_source, _nombre, proceso) => {
      const { resultado } = await proceso('sync-id');
      return resultado;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatamartService,
        { provide: ConfigService, useValue: { get: jest.fn(() => undefined) } },
        { provide: DuckDbBuilderService, useValue: { build, getOutputPath: () => RUTA } },
        { provide: SyncService, useValue: { ejecutarConRegistro } },
      ],
    }).compile();

    service = module.get(DatamartService);
    jest.spyOn((service as any).logger, 'log').mockImplementation();
    jest.spyOn((service as any).logger, 'warn').mockImplementation();
    jest.spyOn((service as any).logger, 'error').mockImplementation();
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Registro en TR_SYNC_PROCESS ──────────────────────────────────────────

  it('registra cada generación como corrida DATAMART', async () => {
    await service.regenerate('on-demand');

    expect(ejecutarConRegistro).toHaveBeenCalledTimes(1);
    expect(ejecutarConRegistro.mock.calls[0][0]).toBe(SyncSource.DATAMART);
  });

  it.each([
    ['on-demand', 'Generación Datamart (on-demand)'],
    ['cron', 'Generación Datamart (cron)'],
    ['startup', 'Generación Datamart (startup)'],
  ])('distingue el origen %s en el nombre de la corrida', async (trigger, nombre) => {
    // El arranque usaba el mismo "on-demand" que el botón, así que en el historial
    // no se podía saber cuál de los dos había generado el archivo.
    await service.regenerate(trigger as any);

    expect(ejecutarConRegistro.mock.calls[0][1]).toBe(nombre);
    expect(ejecutarConRegistro.mock.calls[0][3]).toEqual({ metadata: { trigger } });
  });

  // ─── Generación omitida por solapamiento ──────────────────────────────────

  describe('cuando ya hay una generación en curso', () => {
    /** Deja el build colgado para poder disparar una segunda llamada encima. */
    const buildQueNoTermina = () => {
      let liberar: (r: DatamartBuildResult) => void;
      build.mockReturnValue(new Promise<DatamartBuildResult>((res) => (liberar = res)));
      return () => liberar(resultadoOk());
    };

    it('devuelve un resultado marcado como omitido, no el de la vez anterior', async () => {
      // Una generación previa exitosa deja lastResult con ok:true, que es
      // justamente lo que antes se devolvía como si fuera nuevo.
      await service.regenerate('on-demand');
      expect(service.getStatus().last?.ok).toBe(true);

      const terminar = buildQueNoTermina();
      const enCurso = service.regenerate('cron');
      const omitida = await service.regenerate('on-demand');

      expect(omitida.skipped).toBe(true);
      expect(omitida.ok).toBe(false);
      expect(omitida.error).toMatch(/ya hay una regeneración/i);
      expect(omitida.rowCounts).toEqual({});
      expect(omitida.durationMs).toBe(0);

      terminar();
      await enCurso;
    });

    it('no abre una corrida en TR_SYNC_PROCESS por la generación omitida', async () => {
      const terminar = buildQueNoTermina();
      const enCurso = service.regenerate('cron');
      await service.regenerate('on-demand');

      // Sólo la que sí está corriendo quedó registrada.
      expect(ejecutarConRegistro).toHaveBeenCalledTimes(1);

      terminar();
      await enCurso;
    });

    it('no ejecuta un segundo build', async () => {
      const terminar = buildQueNoTermina();
      const enCurso = service.regenerate('cron');
      await service.regenerate('on-demand');

      expect(build).toHaveBeenCalledTimes(1);

      terminar();
      await enCurso;
    });

    it('no pisa el último resultado conocido con el omitido', async () => {
      await service.regenerate('on-demand');
      const terminar = buildQueNoTermina();
      const enCurso = service.regenerate('cron');

      await service.regenerate('on-demand');

      expect(service.getStatus().last?.skipped).toBeUndefined();

      terminar();
      await enCurso;
    });

    it('vuelve a aceptar generaciones cuando la anterior termina', async () => {
      const terminar = buildQueNoTermina();
      const enCurso = service.regenerate('cron');
      terminar();
      await enCurso;

      const siguiente = await service.regenerate('on-demand');

      expect(siguiente.skipped).toBeUndefined();
      expect(siguiente.ok).toBe(true);
      expect(build).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Fallos ───────────────────────────────────────────────────────────────

  it('un build fallido se distingue de uno omitido', async () => {
    build.mockResolvedValue({ ...resultadoOk(), ok: false, error: 'DuckDB no arrancó' });

    const resultado = await service.regenerate('cron');

    expect(resultado.ok).toBe(false);
    expect(resultado.skipped).toBeUndefined();
    expect(resultado.error).toBe('DuckDB no arrancó');
  });

  it('libera el lock aunque el build lance', async () => {
    build.mockRejectedValue(new Error('boom'));
    await service.regenerate('cron');

    expect(service.isRunning()).toBe(false);
  });
});
