import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { SyncService } from 'src/integrator/service/sync.service';
import { cie10Meddra } from 'src/meddra/models/mapping/cie19meddra.entity';
import { LLT } from 'src/meddra/models/standar/llt.entity';
import { PT } from 'src/meddra/models/standar/pt.entity';
import { SOC } from 'src/meddra/models/standar/soc.entity';
import { MeddraUtils } from 'src/meddra/utils/meddra.utils';
import { MeddraProcessFilesService } from 'src/meddra/services/meddra-process.service';

jest.mock('xlsx');

/** Id de la corrida en TR_SYNC_PROCESS que el helper entrega al proceso. */
const SYNC_ID = 'b7d2e1a0-0000-4000-8000-000000000002';

describe('MeddraProcessFilesService', () => {
  let service: MeddraProcessFilesService;
  let socRepository: any;
  let ptRepository: any;
  let lltRepository: any;
  let cie10MeddraRepository: any;
  let dataSource: any;
  let manager: any;
  let syncService: any;
  /** Managers con los que se invocó cada insert, para comprobar que es siempre el mismo. */
  let managersUsados: any[];

  beforeEach(async () => {
    socRepository = { insert: jest.fn(), find: jest.fn() };
    ptRepository = { insert: jest.fn(), find: jest.fn() };
    lltRepository = { insert: jest.fn() };
    cie10MeddraRepository = { save: jest.fn() };

    // El servicio ya no usa repositorios para SOC/PT/LLT: escribe por el EntityManager de
    // la transacción. El manager falso reparte por entidad hacia los mismos dobles de
    // siempre, de modo que las comprobaciones siguen leyéndose igual.
    const porEntidad = new Map<any, any>([
      [SOC, socRepository],
      [PT, ptRepository],
      [LLT, lltRepository],
      [cie10Meddra, cie10MeddraRepository],
    ]);

    managersUsados = [];
    manager = {
      insert: jest.fn((target: any, filas: any) => {
        managersUsados.push(manager);
        return porEntidad.get(target).insert(filas);
      }),
      save: jest.fn((target: any, filas: any) => {
        managersUsados.push(manager);
        return porEntidad.get(target).save(filas);
      }),
      find: jest.fn((target: any, opciones: any) => porEntidad.get(target).find(opciones)),
    };

    // `dataSource.transaction` de TypeORM confirma si el callback resuelve y revierte si
    // lanza. El doble replica ese contrato y lleva la cuenta, que es lo que permite
    // afirmar que la carga es atómica sin una base real detrás.
    dataSource = {
      confirmadas: 0,
      revertidas: 0,
      transaction: jest.fn(async (cb: (m: any) => Promise<any>) => {
        try {
          const resultado = await cb(manager);
          dataSource.confirmadas++;
          return resultado;
        } catch (e) {
          dataSource.revertidas++;
          throw e;
        }
      }),
    };
    // Por defecto ejecuta el proceso directamente y retorna su "resultado", igual que el SyncService real.
    syncService = {
      ejecutarConRegistro: jest.fn(
        async (_source: string, _name: string, proceso: (syncId: string) => Promise<any>) => {
          const { resultado } = await proceso(SYNC_ID);
          return resultado;
        },
      ),
      buscarPorMetadatos: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeddraProcessFilesService,
        { provide: getRepositoryToken(cie10Meddra, 'MEDDRA'), useValue: cie10MeddraRepository },
        { provide: getDataSourceToken('MEDDRA'), useValue: dataSource },
        { provide: SyncService, useValue: syncService },
      ],
    }).compile();

    service = module.get<MeddraProcessFilesService>(MeddraProcessFilesService);

    // Nunca se debe tocar el filesystem real.
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as any);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── processVersionFiles ─────────────────────────────────────────────────

  describe('processVersionFiles', () => {
    it('lanza BadRequestException si falta la versión o el idioma', async () => {
      await expect(service.processVersionFiles('', 'ES', 'desc')).rejects.toThrow(BadRequestException);
      await expect(service.processVersionFiles('27.0', '', 'desc')).rejects.toThrow(BadRequestException);
      await expect(service.processVersionFiles('   ', '   ', 'desc')).rejects.toThrow(BadRequestException);
    });

    it('lanza ConflictException si la versión/idioma ya existe', async () => {
      syncService.buscarPorMetadatos.mockResolvedValue({ id: 'CORRIDA-PREVIA' });

      await expect(service.processVersionFiles('27.0', 'ES', 'desc')).rejects.toThrow(ConflictException);
    });

    it('crea el directorio y lanza NotFoundException si no existe', async () => {
      jest.spyOn(MeddraUtils, 'directoryExists').mockReturnValue(false);

      await expect(service.processVersionFiles('27.0', 'ES', 'desc')).rejects.toThrow(NotFoundException);
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('procesa SOC, PT y LLT exitosamente y estampa el id de la corrida en los SOC', async () => {
      jest.spyOn(MeddraUtils, 'directoryExists').mockReturnValue(true);
      jest.spyOn(MeddraUtils, 'readFileContent').mockImplementation(async (_v, _l, file) => {
        if (file === 'soc.asc') return [['SOC1', 'Nombre SOC', 'ABBR']];
        if (file === 'pt.asc') return [['PT1', 'Nombre PT', '', 'SOC1']];
        if (file === 'llt.asc') return [['LLT1', 'Nombre LLT', 'PT1', '', '', '', '', '', '', 'ICD10-1']];
        return [];
      });

      socRepository.insert.mockResolvedValue({ identifiers: [{ id: 1 }] });
      socRepository.find.mockResolvedValue([{ id: 1, code: 'SOC1', name: 'Nombre SOC' }]);
      ptRepository.insert.mockResolvedValue({ identifiers: [{ id: 1 }] });
      ptRepository.find.mockResolvedValue([{ id: 1, code: 'PT1', name: 'Nombre PT', socCode: 'SOC1' }]);
      lltRepository.insert.mockResolvedValue({ identifiers: [{ id: 1 }] });

      const result = await service.processVersionFiles('27.0', 'ES', 'desc');

      expect(socRepository.insert).toHaveBeenCalledTimes(1);
      expect(ptRepository.insert).toHaveBeenCalledTimes(1);
      expect(lltRepository.insert).toHaveBeenCalledTimes(1);
      // Cada SOC guarda el uuid de la corrida de TR_SYNC_PROCESS, que es lo que
      // antes hacía la FK a MED_SYNC.
      const socsInsertados = socRepository.insert.mock.calls[0][0];
      expect(socsInsertados[0].syncId).toBe(SYNC_ID);
      expect(result.soc).toHaveLength(1);
      expect(result.pt).toHaveLength(1);
    });

    it('enlaza cada LLT con su PT y cada PT con su SOC', async () => {
      // MED_LLT.ID_PT_CODE quedaba en null en las 88.985 filas del diccionario: processPT
      // acumulaba los ids con `insertedResultIds.concat(ids)` y `concat` no muta, así que
      // devolvía la lista vacía y processLLT no encontraba ningún PT al que enlazar.
      jest.spyOn(MeddraUtils, 'directoryExists').mockReturnValue(true);
      jest.spyOn(MeddraUtils, 'readFileContent').mockImplementation(async (_v, _l, file) => {
        if (file === 'soc.asc') return [['SOC1', 'Nombre SOC', 'ABBR']];
        if (file === 'pt.asc') return [['PT1', 'Nombre PT', '', 'SOC1']];
        if (file === 'llt.asc') return [['LLT1', 'Nombre LLT', 'PT1', '', '', '', '', '', '', 'ICD10-1']];
        return [];
      });

      socRepository.insert.mockResolvedValue({ identifiers: [{ id: 7 }] });
      socRepository.find.mockResolvedValue([{ id: 7, code: 'SOC1', name: 'Nombre SOC' }]);
      ptRepository.insert.mockResolvedValue({ identifiers: [{ id: 42 }] });
      // Se deja vacío a propósito: el resultado ya no debe depender de releer los PT.
      ptRepository.find.mockResolvedValue([]);
      lltRepository.insert.mockResolvedValue({ identifiers: [{ id: 1 }] });

      await service.processVersionFiles('27.0', 'ES', 'desc');

      const ptsInsertados = ptRepository.insert.mock.calls[0][0];
      expect(ptsInsertados[0].soc).toMatchObject({ id: 7, code: 'SOC1' });

      const lltsInsertados = lltRepository.insert.mock.calls[0][0];
      expect(lltsInsertados[0].ptCode).toBe('PT1');
      // El id que devolvió el insert de PT tiene que haber llegado a la entidad enlazada:
      // es lo que termina escribiéndose en MED_LLT.ID_PT_CODE.
      expect(lltsInsertados[0].pt).toMatchObject({ id: 42, code: 'PT1' });
    });

    it('no enlaza el LLT cuyo PT no existe en el archivo, y lo advierte', async () => {
      const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation();
      jest.spyOn(MeddraUtils, 'directoryExists').mockReturnValue(true);
      jest.spyOn(MeddraUtils, 'readFileContent').mockImplementation(async (_v, _l, file) => {
        if (file === 'soc.asc') return [['SOC1', 'Nombre SOC', 'ABBR']];
        if (file === 'pt.asc') return [['PT1', 'Nombre PT', '', 'SOC1']];
        // Apunta a un PT que no viene en pt.asc.
        if (file === 'llt.asc') return [['LLT1', 'Nombre LLT', 'PT-INEXISTENTE', '', '', '', '', '', '', '']];
        return [];
      });

      socRepository.insert.mockResolvedValue({ identifiers: [{ id: 1 }] });
      socRepository.find.mockResolvedValue([{ id: 1, code: 'SOC1' }]);
      ptRepository.insert.mockResolvedValue({ identifiers: [{ id: 1 }] });
      lltRepository.insert.mockResolvedValue({ identifiers: [{ id: 1 }] });

      await service.processVersionFiles('27.0', 'ES', 'desc');

      const lltsInsertados = lltRepository.insert.mock.calls[0][0];
      expect(lltsInsertados[0].pt).toBeUndefined();
      // La carga no aborta: el LLT sigue siendo utilizable por su código.
      expect(lltsInsertados[0].ptCode).toBe('PT-INEXISTENTE');
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('no encontraron su PT'));
    });

    it('propaga el error cuando falla el procesamiento', async () => {
      jest.spyOn(MeddraUtils, 'directoryExists').mockReturnValue(true);
      jest.spyOn(MeddraUtils, 'readFileContent').mockImplementation(async (_v, _l, file) => {
        if (file === 'soc.asc') return [['SOC1', 'Nombre SOC', 'ABBR']];
        return [];
      });

      socRepository.insert.mockRejectedValue(new Error('fallo de insercion'));

      await expect(service.processVersionFiles('27.0', 'ES', 'desc')).rejects.toThrow('fallo de insercion');
      // El error se propaga al helper, que es quien deja la corrida en FAILED.
    });
  });

  // ─── Atomicidad de la carga ──────────────────────────────────────────────

  describe('atomicidad', () => {
    const asc = (...lineas: string[]) => Buffer.from(lineas.join('\n') + '\n', 'latin1');
    const ARCHIVOS = {
      soc: asc('SOC1$Nombre SOC$ABBR$'),
      pt: asc('PT1$Nombre PT$$SOC1$'),
      llt: asc('LLT1$Nombre LLT$PT1$$$$$$$ICD10-1$'),
    };

    const conCargaCorrecta = () => {
      socRepository.insert.mockResolvedValue({ identifiers: [{ id: 1 }] });
      socRepository.find.mockResolvedValue([{ id: 1, code: 'SOC1', name: 'Nombre SOC' }]);
      ptRepository.insert.mockResolvedValue({ identifiers: [{ id: 5 }] });
      lltRepository.insert.mockResolvedValue({ identifiers: [{ id: 9 }] });
    };

    it('inserta los tres niveles dentro de una única transacción', async () => {
      conCargaCorrecta();

      await service.cargarDesdeArchivos(ARCHIVOS, '28_0', 'ES', 'desde zip');

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      // Los tres niveles pasan por el MISMO EntityManager. Es lo que antes no ocurría:
      // los repositorios escribían por su propia conexión y quedaban fuera de la
      // transacción, que además nunca se confirmaba.
      expect(managersUsados).toHaveLength(3);
      expect(new Set(managersUsados).size).toBe(1);
      expect(managersUsados[0]).toBe(manager);
    });

    it('confirma la transacción cuando la carga termina bien', async () => {
      conCargaCorrecta();

      await service.cargarDesdeArchivos(ARCHIVOS, '28_0', 'ES', 'desde zip');

      expect(dataSource.confirmadas).toBe(1);
      expect(dataSource.revertidas).toBe(0);
    });

    it('revierte la carga entera si fallan los LLT, el último nivel', async () => {
      conCargaCorrecta();
      lltRepository.insert.mockRejectedValue(new Error('fallo insertando LLT'));

      await expect(
        service.cargarDesdeArchivos(ARCHIVOS, '28_0', 'ES', 'desde zip'),
      ).rejects.toThrow('fallo insertando LLT');

      // Los SOC y los PT llegaron a ejecutarse, pero al revertirse la transacción no
      // quedan en la base. Antes sí quedaban: una versión marcada como fallida dejaba
      // media jerarquía cargada, y el intento siguiente chocaba con esos restos.
      expect(socRepository.insert).toHaveBeenCalled();
      expect(ptRepository.insert).toHaveBeenCalled();
      expect(dataSource.revertidas).toBe(1);
      expect(dataSource.confirmadas).toBe(0);
    });

    it('revierte también si falla un nivel intermedio', async () => {
      conCargaCorrecta();
      ptRepository.insert.mockRejectedValue(new Error('fallo insertando PT'));

      await expect(
        service.cargarDesdeArchivos(ARCHIVOS, '28_0', 'ES', 'desde zip'),
      ).rejects.toThrow('fallo insertando PT');

      expect(dataSource.revertidas).toBe(1);
      expect(lltRepository.insert).not.toHaveBeenCalled();
    });

    it('no abre la transacción si el parseo falla antes de tocar la base', async () => {
      conCargaCorrecta();
      jest.spyOn(MeddraUtils, 'parseAsc').mockImplementation(() => {
        throw new Error('archivo corrupto');
      });

      await expect(
        service.cargarDesdeArchivos(ARCHIVOS, '28_0', 'ES', 'desde zip'),
      ).rejects.toThrow('archivo corrupto');

      // Parsear 5,5 MB de texto dentro de la transacción sólo alargaría su vida útil.
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  // ─── cargarDesdeArchivos (sin tocar disco) ───────────────────────────────

  describe('cargarDesdeArchivos', () => {
    /** `.asc` de verdad: campos separados por `$`, una línea por registro. */
    const asc = (...lineas: string[]) => Buffer.from(lineas.join('\n') + '\n', 'latin1');

    const ARCHIVOS = {
      soc: asc('SOC1$Nombre SOC$ABBR$'),
      pt: asc('PT1$Nombre PT$$SOC1$'),
      llt: asc('LLT1$Nombre LLT$PT1$$$$$$$ICD10-1$'),
    };

    beforeEach(() => {
      socRepository.insert.mockResolvedValue({ identifiers: [{ id: 1 }] });
      socRepository.find.mockResolvedValue([{ id: 1, code: 'SOC1', name: 'Nombre SOC' }]);
      ptRepository.insert.mockResolvedValue({ identifiers: [{ id: 5 }] });
      lltRepository.insert.mockResolvedValue({ identifiers: [{ id: 9 }] });
    });

    it('parsea los buffers y aplica la jerarquía sin leer del disco', async () => {
      const leerDisco = jest.spyOn(MeddraUtils, 'readFileContent');

      const result = await service.cargarDesdeArchivos(ARCHIVOS, '28_0', 'ES', 'desde zip');

      expect(leerDisco).not.toHaveBeenCalled();
      expect(fs.mkdirSync).not.toHaveBeenCalled();

      const socsInsertados = socRepository.insert.mock.calls[0][0];
      expect(socsInsertados[0]).toMatchObject({ code: 'SOC1', name: 'Nombre SOC', syncId: SYNC_ID });

      const ptsInsertados = ptRepository.insert.mock.calls[0][0];
      expect(ptsInsertados[0]).toMatchObject({ code: 'PT1', socCode: 'SOC1' });
      expect(ptsInsertados[0].soc).toMatchObject({ id: 1, code: 'SOC1' });

      const lltsInsertados = lltRepository.insert.mock.calls[0][0];
      expect(lltsInsertados[0]).toMatchObject({ code: 'LLT1', ptCode: 'PT1', icd10Code: 'ICD10-1' });
      expect(lltsInsertados[0].pt).toMatchObject({ id: 5, code: 'PT1' });

      expect(result.soc).toHaveLength(1);
    });

    it('registra la corrida con la versión, el idioma y el usuario que la lanzó', async () => {
      const usuario = { id: 'sub-1', username: 'rcasigna' };

      await service.cargarDesdeArchivos(ARCHIVOS, '28_0', 'ES', 'desde zip', usuario);

      const [source, nombre, , opciones] = syncService.ejecutarConRegistro.mock.calls[0];
      expect(source).toBe('MEDDRA');
      expect(nombre).toBe('Sincronización MedDRA 28_0/ES');
      expect(opciones.metadata).toEqual({ version: '28_0', lang: 'ES', description: 'desde zip' });
      expect(opciones.usuario).toEqual(usuario);
    });

    it('normaliza el idioma a mayúsculas', async () => {
      await service.cargarDesdeArchivos(ARCHIVOS, '28_0', 'es', 'desde zip');

      expect(syncService.ejecutarConRegistro.mock.calls[0][3].metadata.lang).toBe('ES');
    });

    it('rechaza la carga si la versión ya está en la base', async () => {
      syncService.buscarPorMetadatos.mockResolvedValue({ id: 'corrida-previa' });

      await expect(
        service.cargarDesdeArchivos(ARCHIVOS, '28_0', 'ES', 'desde zip'),
      ).rejects.toThrow(ConflictException);
      expect(syncService.ejecutarConRegistro).not.toHaveBeenCalled();
    });

    it('exige versión e idioma', async () => {
      await expect(service.cargarDesdeArchivos(ARCHIVOS, '', 'ES', 'x')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cargarDesdeArchivos(ARCHIVOS, '28_0', '', 'x')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('conserva los acentos de los términos en español (latin1, no UTF-8)', async () => {
      const conAcentos = {
        ...ARCHIVOS,
        soc: Buffer.from('SOC1$Infección e infestación$ABBR$\n', 'latin1'),
      };

      await service.cargarDesdeArchivos(conAcentos, '28_0', 'ES', 'desde zip');

      expect(socRepository.insert.mock.calls[0][0][0].name).toBe('Infección e infestación');
    });
  });

  // ─── processCIE10Meddra ──────────────────────────────────────────────────

  describe('processCIE10Meddra', () => {
    it('lanza NotFoundException si el archivo no existe', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      await expect(service.processCIE10Meddra('1', 'ES')).rejects.toThrow(NotFoundException);
    });

    const excelConUnaFila = () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      (XLSX.readFile as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} },
      });
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        [],
        ['1', 'Capitulo I', 'A00', 'Termino', 'LLT Name', 'LLT001', 'EXACT', 'PT Name', 'PT001'],
      ]);
      cie10MeddraRepository.save.mockResolvedValue([]);
    };

    it('procesa el excel y guarda los registros CIE10-MedDRA, saltando filas vacías', async () => {
      excelConUnaFila();

      const result = await service.processCIE10Meddra('1', 'ES');

      expect(result).toBe(true);
      expect(cie10MeddraRepository.save).toHaveBeenCalledTimes(1);
      const savedChunk = cie10MeddraRepository.save.mock.calls[0][0];
      expect(savedChunk).toHaveLength(1);
      expect(savedChunk[0].icd10_code).toBe('A00');
      expect(savedChunk[0].meddra_llt_code).toBe('LLT001');
    });

    it('estampa la auditoría en cada fila', async () => {
      excelConUnaFila();

      await service.processCIE10Meddra('1', 'ES');

      // `withAuditOnCreate` devuelve una copia y no muta: se llamaba descartando el
      // retorno, así que las filas salían sin AUD_USUARIO_CREACION —columna NOT NULL— y
      // el guardado reventaba siempre.
      const [fila] = cie10MeddraRepository.save.mock.calls[0][0];
      expect(fila.createdBy).toBeTruthy();
      expect(fila.createdAt).toBeInstanceOf(Date);
      expect(fila.isActive).toBe(true);
    });

    it('busca el archivo en upload_files/meddra, en minúsculas', async () => {
      excelConUnaFila();

      await service.processCIE10Meddra('28', 'EN');

      // En macOS daba igual, pero en el contenedor Linux `MEDDRA` no existe y el método
      // fallaba siempre con NotFoundException.
      const rutaConsultada = (fs.existsSync as unknown as jest.Mock).mock.calls[0][0] as string;
      expect(rutaConsultada).toContain('upload_files/meddra/28/EN/ICD_10_TO_MEDDRA_EN_28.xlsx');
    });

    it('guarda todo dentro de una única transacción', async () => {
      excelConUnaFila();

      await service.processCIE10Meddra('1', 'ES');

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(dataSource.confirmadas).toBe(1);
      expect(manager.save).toHaveBeenCalledTimes(1);
    });

    it('revierte el mapeo entero si falla un lote', async () => {
      excelConUnaFila();
      cie10MeddraRepository.save.mockRejectedValue(new Error('fallo guardando CIE10'));

      await expect(service.processCIE10Meddra('1', 'ES')).rejects.toThrow('fallo guardando CIE10');

      // Antes cada lote de 5.000 se confirmaba por su cuenta: un fallo a mitad dejaba
      // parte de las equivalencias cargadas y sin forma de saber cuáles, porque este
      // proceso no queda registrado en TR_SYNC_PROCESS.
      expect(dataSource.revertidas).toBe(1);
      expect(dataSource.confirmadas).toBe(0);
    });

    it('no abre la transacción si el archivo no existe', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      await expect(service.processCIE10Meddra('1', 'ES')).rejects.toThrow(NotFoundException);

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  // ─── validarVersion ──────────────────────────────────────────────────────

  describe('validarVersion', () => {
    it('retorna true si la versión/idioma ya está registrada', async () => {
      syncService.buscarPorMetadatos.mockResolvedValue({ id: 'CORRIDA-PREVIA' });

      expect(await service.validarVersion('27.0', 'ES')).toBe(true);
    });

    it('retorna false si la versión/idioma no existe', async () => {
      syncService.buscarPorMetadatos.mockResolvedValue(null);

      expect(await service.validarVersion('27.0', 'ES')).toBe(false);
    });

    it('consulta el log único por los metadatos version/lang de la fuente MEDDRA', async () => {
      syncService.buscarPorMetadatos.mockResolvedValue(null);

      await service.validarVersion('27.0', 'ES');

      expect(syncService.buscarPorMetadatos).toHaveBeenCalledWith('MEDDRA', {
        version: '27.0',
        lang: 'ES',
      });
    });
  });
});
