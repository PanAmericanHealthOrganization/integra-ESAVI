import {DataSource,EntityManager,In,InsertResult} from 'typeorm';
import {LLT} from '../models/standar/llt.entity';

import {BadRequestException, ConflictException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {InjectDataSource} from '@nestjs/typeorm';
import * as fs from 'fs';
import {join} from 'path';
import {withAuditOnCreate} from 'src/common/utils/audit.util';
import {SyncSource} from 'src/integrator/entity';
import {SyncService} from 'src/integrator/service/sync.service';
import {DestinatarioNotificacion} from 'src/mensajes/models/notificacion.interface';
import * as XLSX from 'xlsx';
import {cie10Meddra} from '../models/mapping/cie19meddra.entity';
import {PT} from '../models/standar/pt.entity';
import {SOC} from '../models/standar/soc.entity';
import {MeddraUtils} from '../utils/meddra.utils';

/** Contenido de los tres `.asc` de la jerarquía, ya troceado por el separador `$`. */
export interface ContenidosMeddra {
  soc: string[][];
  pt: string[][];
  llt: string[][];
}

/** Los mismos tres archivos, todavía como buffers recibidos por multipart. */
export interface ArchivosMeddraEnMemoria {
  soc: Buffer;
  pt: Buffer;
  llt: Buffer;
}

/**
 * Permite procesar los archivos de meddra
 */
@Injectable()
export class MeddraProcessFilesService {
  meddraVersionFilePath = null;
  constructor(
    // No se inyecta ningún repositorio: las dos cargas de este servicio son atómicas y
    // todas sus escrituras van por el `EntityManager` de su transacción. Un repositorio
    // suelto escribiría por su propia conexión, fuera de ella —que es exactamente lo que
    // hacía que la transacción original no sirviera de nada—.
    @InjectDataSource('MEDDRA')
    private readonly dataSource: DataSource,

    private readonly syncService: SyncService,
  ) {
    this.meddraVersionFilePath = '';
  }

  private readonly logger = new Logger(MeddraProcessFilesService.name);

  /**
   * Procesa una versión de MedDRA a partir de los archivos ya presentes en
   * `upload_files/meddra/<versión>/<idioma>/`.
   *
   * Es el camino histórico, que sigue sirviendo para las versiones que ya están en el
   * servidor. La carga desde la interfaz usa {@link cargarDesdeArchivos}, que no toca el
   * disco en ningún momento.
   */
  async processVersionFiles(
    version: string | number,
    lang: string | number,
    description: string,
    usuario?: DestinatarioNotificacion | null,
  ): Promise<any> {
    const { versionStr, langStr } = this.normalizarVersionEIdioma(version, lang);
    await this.exigirVersionNoCargada(versionStr, langStr);

    const path = join(process.cwd(), 'upload_files', 'meddra', versionStr, langStr);
    this.logger.log(`Directorio MedDRA: ${path}`);

    if (!MeddraUtils.directoryExists(path)) {
      // Crear la estructura de directorios para que el usuario pueda subir los archivos
      fs.mkdirSync(path, { recursive: true });
      throw new NotFoundException(
        `El directorio upload_files/meddra/${versionStr}/${langStr} no existía y fue creado. ` +
        `Coloca los archivos soc.asc, pt.asc y llt.asc en esa carpeta y vuelve a intentarlo.`
      );
    }

    return this.ejecutarCarga(versionStr, langStr, description, usuario, async () => ({
      soc: await MeddraUtils.readFileContent(versionStr, langStr, 'soc.asc'),
      pt: await MeddraUtils.readFileContent(versionStr, langStr, 'pt.asc'),
      llt: await MeddraUtils.readFileContent(versionStr, langStr, 'llt.asc'),
    }));
  }

  /**
   * Procesa una versión de MedDRA a partir de los archivos recibidos por multipart.
   *
   * **Nada se escribe en disco**: los buffers se parsean en memoria y se descartan al
   * terminar. El ZIP original se descomprime en el navegador —la contraseña de MSSO
   * nunca llega al servidor— y sólo viajan los tres `.asc` que se leen aquí.
   *
   * @param archivos contenido crudo de `soc.asc`, `pt.asc` y `llt.asc`
   */
  async cargarDesdeArchivos(
    archivos: ArchivosMeddraEnMemoria,
    version: string,
    lang: string,
    description: string,
    usuario?: DestinatarioNotificacion | null,
  ): Promise<any> {
    const { versionStr, langStr } = this.normalizarVersionEIdioma(version, lang);
    await this.exigirVersionNoCargada(versionStr, langStr);

    // El parseo va dentro de la corrida, no aquí: si un archivo viene corrupto, el fallo
    // queda registrado en TR_SYNC_PROCESS y notificado como cualquier otro error de
    // carga, en lugar de perderse en un proceso de fondo que nadie observa.
    return this.ejecutarCarga(versionStr, langStr, description, usuario, async () => ({
      soc: MeddraUtils.parseAsc(archivos.soc),
      pt: MeddraUtils.parseAsc(archivos.pt),
      llt: MeddraUtils.parseAsc(archivos.llt),
    }));
  }

  /**
   * Núcleo compartido por las dos vías de carga.
   *
   * Registra la corrida y aplica la jerarquía en orden —SOC, luego PT (que necesita los
   * SOC), luego LLT (que necesita los PT)—. `cargar` se invoca ya dentro de la corrida
   * para que un error de lectura o de parseo también quede registrado como FAILED.
   *
   * **La carga es atómica**: los tres niveles se insertan dentro de una única
   * transacción, así que un fallo a mitad no deja el diccionario partido. Antes esto no
   * era cierto pese a las apariencias —había un `queryRunner` con `startTransaction()`
   * que nunca se confirmaba y que los repositorios ni siquiera usaban—, y un error al
   * insertar los LLT dejaba en la base los SOC y los PT de una versión que constaba como
   * fallida. Recargarla después chocaba con datos a medias que nadie había pedido.
   *
   * La transacción es larga (unos 116.000 registros): se acepta a cambio de la
   * atomicidad. No bloquea a los lectores, porque son inserciones en tablas que la carga
   * sólo añade, y la corrida de TR_SYNC_PROCESS vive en otro datasource, de modo que el
   * FAILED queda registrado aunque estas inserciones se deshagan.
   *
   * La versión, el idioma y la descripción viajan como metadatos: es lo que antes
   * guardaba MED_SYNC y lo que `validarVersion` vuelve a leer.
   */
  private async ejecutarCarga(
    versionStr: string,
    langStr: string,
    description: string,
    usuario: DestinatarioNotificacion | null | undefined,
    cargar: () => Promise<ContenidosMeddra>,
  ): Promise<any> {
    return this.syncService.ejecutarConRegistro(
      SyncSource.MEDDRA,
      `Sincronización MedDRA ${versionStr}/${langStr}`,
      async (syncId) => {
        // Parsear fuera de la transacción: no toca la base y mantenerla abierta mientras
        // se trocean 5,5 MB de texto sólo alarga el tiempo de vida de la transacción.
        const contenidos = await cargar();

        const { socDB, ptDB, llDB } = await this.dataSource.transaction(async (manager) => {
          // Nivel superior
          const socDB = await this.processSOC(manager, contenidos.soc, syncId);
          // Nivel intermedio, requiere soc por pt
          const ptDB = await this.processPT(manager, contenidos.pt, socDB);
          // Nivel inferior, requiere pt por llt
          const llDB = await this.processLLT(manager, contenidos.llt, ptDB);
          return { socDB, ptDB, llDB };
        });

        this.logger.log('Proceso de archivos de meddra finalizado');
        return {
          resultado: { soc: socDB, pt: ptDB, llt: llDB },
          mensaje: `Versión MedDRA ${versionStr}/${langStr} procesada exitosamente`,
          metadata: { socs: socDB.length, pts: ptDB.length },
        };
      },
      { metadata: { version: versionStr, lang: langStr, description }, usuario },
    );
  }

  /** Versión e idioma en la forma con la que se etiqueta la corrida. */
  private normalizarVersionEIdioma(
    version: string | number,
    lang: string | number,
  ): { versionStr: string; langStr: string } {
    const versionStr = String(version ?? '').trim();
    const langStr = String(lang ?? '').trim().toUpperCase();

    if (!versionStr || !langStr) {
      throw new BadRequestException('Los parámetros de versión e idioma son obligatorios');
    }
    return { versionStr, langStr };
  }

  /**
   * Recargar una versión ya cargada duplicaría toda la terminología, porque la carga
   * inserta sin borrar lo anterior.
   */
  private async exigirVersionNoCargada(versionStr: string, langStr: string): Promise<void> {
    if (await this.validarVersion(versionStr, langStr)) {
      throw new ConflictException(
        `La versión ${versionStr}/${langStr} ya existe en la base de datos`,
      );
    }
  }

  /**
   * Permite procesar los SOC y guardarlos en la base de datos
   * @param manager manager de la transacción que envuelve toda la carga
   * @param soc contenido soc de la base de datos
   * @param syncId corrida de TR_SYNC_PROCESS que está cargando esta versión
   * @returns
   */
  private async processSOC(manager: EntityManager, soc: string[][], syncId: string): Promise<SOC[]> {
    const lltList = [];
    soc.forEach((line) => {
      const soc = withAuditOnCreate(new SOC());
      soc.code = line[0];
      soc.name = line[1];
      soc.abbrev = line[2];
      soc.syncId = syncId;
      lltList.push(soc);
    });
    const inserted = await manager.insert(SOC, lltList);
    const ids = inserted.identifiers.map((id) => id.id);
    this.logger.log(`Insertados SOC ${lltList.length} de ${lltList.length}`);
    // La relectura ve las filas recién insertadas porque va por el mismo manager: desde
    // fuera de la transacción todavía no existen.
    return await manager.find(SOC, { where: [{ id: In(ids) }] });
  }
  /**
   * Permite procesar los PT y guardarlos en la base de datos
   * @param manager manager de la transacción que envuelve toda la carga
   * @param pt
   * @param socs
   * @returns
   */
  private async processPT(manager: EntityManager, pt: string[][], socs: SOC[]): Promise<PT[]> {
    // Índice por código en lugar de un find() por fila: son ~27 SOC contra ~26.600 PT.
    const socsPorCodigo = new Map(socs.map((soc) => [soc.code, soc]));

    const ptList: PT[] = [];
    pt.forEach((line) => {
      const nuevo = withAuditOnCreate(new PT());
      nuevo.code = line[0];
      nuevo.name = line[1];
      nuevo.socCode = line[3];
      nuevo.soc = socsPorCodigo.get(line[3]);
      ptList.push(nuevo);
    });

    // procesar de 5000 en 5000
    const chunkSize = 5000;
    for (let i = 0; i < ptList.length; i += chunkSize) {
      const chunkList = ptList.slice(i, i + chunkSize);
      const inserted = await manager.insert(PT, chunkList);

      // El id generado se copia sobre la entidad que ya está en memoria. Antes los
      // identificadores se acumulaban con `insertedResultIds.concat(ids)`, y `concat` no
      // muta: devuelve un array nuevo que se descartaba. La lista quedaba vacía, el
      // `find({ id: In([]) })` no traía nada y processLLT recibía cero PT, de modo que
      // `llt.pt` quedaba undefined y MED_LLT.ID_PT_CODE se guardaba en null en las 88.985
      // filas. Esa era la causa de que la jerarquía SOC→PT→LLT saliera incompleta.
      chunkList.forEach((entidad, indice) => {
        const id = inserted.identifiers[indice]?.id;
        if (id != null) entidad.id = id as number;
      });

      this.logger.log(
        `Insertados PT ${Math.min(i + chunkSize, ptList.length)} de ${ptList.length}`,
      );
    }

    // Se devuelven las entidades en memoria, ya con su id: releerlas suponía un IN con
    // ~26.600 identificadores para recuperar lo que ya se tenía.
    return ptList;
  }
  /**
   *
   * @param manager manager de la transacción que envuelve toda la carga
   * @param lltData
   * @param pts
   * @returns
   */
  private async processLLT(
    manager: EntityManager,
    lltData: string[][],
    pts: PT[],
  ): Promise<InsertResult[]> {
    // Índice por código: un find() por fila serían ~89.000 × ~26.600 comparaciones.
    const ptsPorCodigo = new Map(pts.map((pt) => [pt.code, pt]));

    const lltList: LLT[] = [];
    lltData.forEach((line) => {
      const llt = withAuditOnCreate(new LLT());
      llt.code = line[0];
      llt.name = line[1];
      llt.ptCode = line[2];
      llt.pt = ptsPorCodigo.get(line[2]);
      llt.icd10Code = line[9];
      lltList.push(llt);
    });

    const sinPt = lltList.filter((llt) => !llt.pt).length;
    if (sinPt > 0) {
      // No aborta la carga: un LLT sin PT sigue siendo utilizable por su código. Pero
      // conviene que quede en el log, porque significa que el archivo trae códigos de PT
      // que no existen en el propio archivo de PT.
      this.logger.warn(`${sinPt} de ${lltList.length} LLT no encontraron su PT por código`);
    }

    // procesar de 5000 en 5000
    const batchSize = 5000;
    const insertedResult = [];
    for (let i = 0; i < lltList.length; i += batchSize) {
      const batch = lltList.slice(i, i + batchSize);
      insertedResult.push(await manager.insert(LLT, batch));
      this.logger.log(
        `Insertados LLT ${Math.min(i + batchSize, lltList.length)} de ${lltList.length}`,
      );
    }
    return insertedResult;
  }

  /**
   * Permite procesar los archivos de una versión de cie10meddra.
   *
   * **La carga es atómica**, igual que la de la jerarquía: el mapeo CIE-10↔MedDRA se
   * guarda entero o no se guarda. Antes los lotes de 5.000 se confirmaban uno a uno, así
   * que un fallo a mitad dejaba parte de las equivalencias cargadas y sin forma de saber
   * cuáles, porque este proceso ni siquiera queda registrado en TR_SYNC_PROCESS.
   *
   * @param version versión de MedDRA, tal como nombra al directorio
   * @param lang idioma del archivo (`ES`, `EN`)
   */
  async processCIE10Meddra(version: string, lang: string): Promise<boolean> {
    this.logger.log(`Procesando CIE10-MedDRA ${version}/${lang}`);

    const fileName = `ICD_10_TO_MEDDRA_${lang}_${version}.xlsx`;
    // El directorio es `meddra` en minúsculas, como en el resto del servicio. Estaba
    // escrito `MEDDRA`: en macOS colaba porque el sistema de archivos no distingue
    // mayúsculas, pero en el contenedor Linux la ruta no existía y el método fallaba
    // siempre con "el archivo no existe".
    const filePath = join(process.cwd(), 'upload_files', 'meddra', version, lang, fileName);

    if (!fs.existsSync(filePath)) {
      this.logger.error(`El archivo ${filePath} no existe`);
      throw new NotFoundException(`El archivo ${fileName} no existe en upload_files/meddra/${version}/${lang}/`);
    }

    // Leer y mapear el Excel fuera de la transacción: no toca la base, y mantenerla
    // abierta durante el parseo sólo alarga su tiempo de vida.
    const cie10List = this.leerCie10DelExcel(filePath);

    await this.dataSource.transaction(async (manager) => {
      const chunkSize = 5000;
      for (let i = 0; i < cie10List.length; i += chunkSize) {
        const chunk = cie10List.slice(i, i + chunkSize);
        await manager.save(cie10Meddra, chunk);
        this.logger.log(
          `Insertados CIE10-MedDRA ${Math.min(i + chunkSize, cie10List.length)} de ${cie10List.length}`,
        );
      }
    });

    this.logger.log('Proceso de archivos de CIE10-MedDRA finalizado');
    return true;
  }

  /** Convierte las filas del Excel de equivalencias en entidades listas para guardar. */
  private leerCie10DelExcel(filePath: string): cie10Meddra[] {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 2 }); // Skip first 2 rows

    const cie10List: cie10Meddra[] = [];

    for (const row of data) {
      if (row.length === 0) continue;

      const entity = new cie10Meddra();

      entity.icd10_charper_number = String(row[0] || '');
      entity.icd10_charper = String(row[1] || '');
      entity.icd10_code = String(row[2] || '');
      entity.icd10_term = String(row[3] || '');
      entity.meddra_llt_name = String(row[4] || '');
      entity.meddra_llt_code = String(row[5] || '');
      entity.equivalence = String(row[6] || '');
      entity.meddra_pt_name = String(row[7] || '');
      entity.meddra_pt_code = String(row[8] || '');

      // `withAuditOnCreate` no muta: devuelve una copia. Se llamaba como
      // `withAuditOnCreate(entity)` descartando el retorno, así que los campos de
      // auditoría nunca llegaban a la entidad y el insert violaba el NOT NULL de
      // AUD_USUARIO_CREACION. Hay que quedarse con lo que devuelve.
      cie10List.push(withAuditOnCreate(entity));
    }

    return cie10List;
  }

  /**
   * ¿Ya se cargó esa versión/idioma? Se resuelve contra el log único de
   * sincronizaciones (antes contra MED_SYNC). Sólo cuentan las corridas
   * COMPLETED: una carga que falló a medias debe poder reintentarse.
   */
  async validarVersion(meddraVersion: string, lang: string): Promise<boolean> {
    const corrida = await this.syncService.buscarPorMetadatos(SyncSource.MEDDRA, {
      version: meddraVersion,
      lang,
    });
    return corrida !== null;
  }
}
