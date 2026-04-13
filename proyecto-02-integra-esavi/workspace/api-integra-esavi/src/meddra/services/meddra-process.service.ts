import { DataSource, In, InsertResult, Repository } from 'typeorm';
import { LLT } from '../models/standar/llt.entity';

import { Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import { join } from 'path';
import { withAuditOnCreate } from 'src/common/utils/audit.util';
import * as XLSX from 'xlsx';
import { cie10Meddra } from '../models/mapping/cie19meddra.entity';
import { MeddraSync } from '../models/standar/meddraSync.entity';
import { PT } from '../models/standar/pt.entity';
import { SOC } from '../models/standar/soc.entity';
import { MeddraUtils } from '../utils/meddra.utils';
/**
 * Permite procesar los archivos de meddra
 */
export class MeddraProcessFilesService {
  meddraVersionFilePath = null;
  constructor(
    @InjectRepository(SOC, 'meddra')
    private readonly socRepository: Repository<SOC>,

    @InjectRepository(PT, 'meddra')
    private readonly ptRepository: Repository<PT>,

    @InjectRepository(LLT, 'meddra')
    private readonly lltRepository: Repository<LLT>,

    @InjectRepository(MeddraSync, 'meddra')
    private readonly meddraSuncRepository: Repository<MeddraSync>,

    @InjectRepository(cie10Meddra, 'meddra')
    private readonly cie10MeddraRepository: Repository<cie10Meddra>,

    @InjectDataSource('meddra')
    private dataSource: DataSource,
  ) {
    this.meddraVersionFilePath = '';
  }

  private readonly logger = new Logger(MeddraProcessFilesService.name);
  /**
   * Permite procesar los archivos que están en  una versión de meddra
   * @param version
   */
  async processVersionFiles(version: string | number, lang: string | number, description: string): Promise<any> {
    const versionStr = String(version ?? '').trim();
    const langStr = String(lang ?? '').trim();
    console.log('version ::::', versionStr, langStr, description);
    if (!versionStr || !langStr) {
      throw new Error('Los parámetros de versión e idioma son obligatorios');
    }

    // leer el archjivo del repositio upload_files/meddra*/27/es
    const exist = await this.validarVersion(versionStr, langStr);
    if (exist) {
      throw new Error('La versión ya existe en la base de datos');
    }
    // validar que exista el directorio
    const path = join(process.cwd(), 'upload_files', 'meddra', versionStr, langStr);
    console.log('Patth::: ', path);

    if (!MeddraUtils.directoryExists(path)) {
      throw new Error('El directorio no existe');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let socDB = [];
    let ptDB = [];
    let llDB = [];
    try {
      // Crear la versión
      const versionEntity = await this.meddraSuncRepository.save(
        withAuditOnCreate(new MeddraSync(versionStr, langStr, description)),
      );

      // Nivel superior
      const soc = await MeddraUtils.readFileContent(versionStr, langStr, 'soc.asc');
      socDB = await this.processSOC(soc, versionEntity);

      // Nivel intermedio, requiere soc por pt
      const ptDataFile = await MeddraUtils.readFileContent(versionStr, langStr, 'pt.asc');
      ptDB = await this.processPT(ptDataFile, socDB);

      // Nivel inferior, requiere pt por llt
      const lltDataFile = await MeddraUtils.readFileContent(versionStr, langStr, 'llt.asc');
      llDB = await this.processLLT(lltDataFile, ptDB);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
    this.logger.log('Proceso de archivos de meddra finalizado');
    return { soc: socDB, pt: ptDB, llt: llDB };
    /**
     *
     */
  }

  /**
   * Permite procesar los SOC y guardarlos en la base de datos
   * @param soc contenido soc de la base de datos
   * @param meddraSync
   * @returns
   */
  private async processSOC(soc: string[][], meddraSync: MeddraSync): Promise<SOC[]> {
    const lltList = [];
    soc.forEach((line) => {
      const soc = withAuditOnCreate(new SOC());
      soc.code = line[0];
      soc.name = line[1];
      soc.abbrev = line[2];
      soc.meddraSync = meddraSync;
      lltList.push(soc);
    });
    const inserted = await this.socRepository.insert(lltList);
    const ids = inserted.identifiers.map((id) => id.id);
    this.logger.log(`Insertados SOC ${lltList.length} de ${lltList.length}`);
    return await this.socRepository.find({ where: [{ id: In(ids) }] });
  }
  /**
   * Permite procesar los PT y guardarlos en la base de datos
   * @param pt
   * @param socs
   * @returns
   */
  private async processPT(pt: string[][], socs: SOC[]): Promise<PT[]> {
    const ptList = [];
    pt.forEach((line) => {
      const pt = withAuditOnCreate(new PT());
      pt.code = line[0];
      pt.name = line[1];
      pt.socCode = line[3];
      pt.soc = socs.find((soc) => soc.code === line[3]);
      ptList.push(pt);
    });
    const insertedResultIds = [];
    // procesar de 5000 en 5000
    const chunkSize = 5000;
    for (let i = 0; i < ptList.length; i += chunkSize) {
      // Extraer un "chunk" o trozo de la lista
      const chunkList = ptList.slice(i, i + chunkSize);

      // Procesa el chunk aquí
      const inserted = await this.ptRepository.insert(chunkList);
      const ids = inserted.identifiers.map((id) => id.id);
      this.logger.log(`Insertados PT ${i + chunkSize} de ${ptList.length}`);
      insertedResultIds.concat(ids);
    }
    return this.ptRepository.find({ where: { id: In(insertedResultIds) } });
  }
  /**
   *
   * @param soc
   * @param version
   * @returns
   */
  private async processLLT(socs: string[][], pts: PT[]): Promise<InsertResult[]> {
    const lltList = [];
    socs.forEach((line) => {
      const socs = withAuditOnCreate(new LLT());
      socs.code = line[0];
      socs.name = line[1];
      socs.ptCode = line[3];
      socs.pt = pts.find((pt) => pt.code === line[3]);
      lltList.push(socs);
    });
    // procesar de 5000 en 5000
    const batchSize = 5000;
    const insertedResult = [];
    for (let i = 0; i < lltList.length; i += batchSize) {
      const batch = lltList.slice(i, i + batchSize);
      insertedResult.push(await this.lltRepository.insert(batch));
      this.logger.log(`Insertados LLT ${i + batchSize} de ${lltList.length}`);
    }
    return insertedResult;
  }

  /**
   * Permite procesar loa archivos de una versión de cie10meddra
   * @param version
   */
  async processCIE10Meddra(version: string, lang: string): Promise<boolean> {
    console.log(`Procesando CIE10Meddra${version}${lang}`);
    const fileName = `ICD_10_TO_MEDDRA_${lang}_${version}.xlsx`;
    const filePath = join(process.cwd(), 'upload_files', 'meddra', version, lang, fileName);

    if (!fs.existsSync(filePath)) {
      this.logger.error(`El archivo ${filePath} no existe`);
      throw new Error(`El archivo ${filePath} no existe`);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 2 }); // Skip first 2 rows

    const cie10List: cie10Meddra[] = [];

    for (const row of data) {
      if (row.length === 0) continue;

      const entity = new cie10Meddra();
      // Mapping based on column index from inspection
      // 0: ICD-10 Chapter Number
      // 1: ICD-10 Chapter
      // 2: ICD-10 Code
      // 3: ICD-10 Term
      // 4: Mapped MedDRA LLT
      // 5: Mapped MedDRA LLT Code
      // 6: Map Attribute
      // 7: MedDRA PT
      // 8: MedDRA PT Code

      entity.icd10_charper_number = String(row[0] || '');
      entity.icd10_charper = String(row[1] || '');
      entity.icd10_code = String(row[2] || '');
      entity.icd10_term = String(row[3] || '');
      entity.meddra_llt_name = String(row[4] || '');
      entity.meddra_llt_code = String(row[5] || '');
      entity.equivalence = String(row[6] || '');
      entity.meddra_pt_name = String(row[7] || '');
      entity.meddra_pt_code = String(row[8] || '');

      withAuditOnCreate(entity);
      cie10List.push(entity);
    }

    const chunkSize = 5000;
    for (let i = 0; i < cie10List.length; i += chunkSize) {
      const chunk = cie10List.slice(i, i + chunkSize);
      await this.cie10MeddraRepository.save(chunk);
      this.logger.log(`Insertados CIE10-MedDRA ${Math.min(i + chunkSize, cie10List.length)} de ${cie10List.length}`);
    }

    this.logger.log('Proceso de archivos de CIE10-MedDRA finalizado');
    return true;
  }

  async validarVersion(meddraVersion: string, lang: string): Promise<boolean> {
    const versionExist = await this.meddraSuncRepository.findOne({
      where: { meddraVersion, lang, isEnabled: true },
    });
    return versionExist ? true : false;
  }
}
