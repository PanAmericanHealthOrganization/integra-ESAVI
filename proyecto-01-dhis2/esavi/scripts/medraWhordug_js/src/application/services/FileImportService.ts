import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';
import { createReadStream } from 'fs';
import { MedraRepository } from '../../infrastructure/database/repositories/MedraRepository';
import { WhoDrugRepository } from '../../infrastructure/database/repositories/WhoDrugRepository';
import { MapeoMedraCie10 } from '../../domain/entities/MapeoMedraCie10';
import { DatosWhodrug } from '../../domain/entities/DatosWhodrug';

export class FileImportService {
  private medraRepo: MedraRepository;
  private whoDrugRepo: WhoDrugRepository;
  private medraPath: string;
  private whoDrugPath: string;

  constructor() {
    this.medraRepo = new MedraRepository();
    this.whoDrugRepo = new WhoDrugRepository();
    this.medraPath = process.env.DATA_MEDRA_PATH || './data-medra';
    this.whoDrugPath = process.env.DATA_WHODRUG_PATH || './data-whodrug';
  }

  public async init(): Promise<void> {
    console.log('Checking for data import files...');
    await this.processMedraFiles();
    await this.processWhoDrugFiles();
  }

  private async processMedraFiles(): Promise<void> {
    try {
      await fs.mkdir(this.medraPath, { recursive: true });
      const files = await fs.readdir(this.medraPath);

      for (const fileName of files) {
        const filePath = path.join(this.medraPath, fileName);
        console.log(`Processing Medra file: ${fileName}`);
        await this.readMedraContent(filePath);
        await fs.unlink(filePath);
        console.log(`Medra file ${fileName} processed and deleted.`);
      }
    } catch (error) {
      console.error('Error processing Medra files:', error);
    }
  }

  private async readMedraContent(filePath: string): Promise<void> {
    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let isFirstLine = true;
    for await (const line of rl) {
      if (isFirstLine) {
        isFirstLine = false;
        continue;
      }
      try {
        const splitStr = line.split(';');
        if (splitStr.length >= 3) {
          const mm = new MapeoMedraCie10();
          mm.codigoCie10 = splitStr[0];
          mm.terminoCie10 = splitStr[1];
          mm.codigoLltMeddra = splitStr[2];
          await this.medraRepo.agregaActualizaMedraToCie10(mm);
        }
      } catch (e) {
        console.log(`Problem with line in Medra file: ${line}`);
      }
    }
  }

  private async processWhoDrugFiles(): Promise<void> {
    try {
      await fs.mkdir(this.whoDrugPath, { recursive: true });
      const files = await fs.readdir(this.whoDrugPath);

      for (const fileName of files) {
        const filePath = path.join(this.whoDrugPath, fileName);
        console.log(`Processing WhoDrug file: ${fileName}`);
        
        // En Java, se limpia la tabla antes de procesar el archivo WhoDrug
        await this.whoDrugRepo.deleteWhodrugData();
        
        await this.readWhoDrugContent(filePath);
        await fs.unlink(filePath);
        console.log(`WhoDrug file ${fileName} processed and deleted.`);
      }
    } catch (error) {
      console.error('Error processing WhoDrug files:', error);
    }
  }

  private async readWhoDrugContent(filePath: string): Promise<void> {
    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let isFirstLine = true;
    let columnNames: string[] = [];

    for await (const line of rl) {
      const splitStr = line.split('|', -1);
      
      if (isFirstLine) {
        columnNames = splitStr.map(c => c.trim());
        isFirstLine = false;
        continue;
      }

      try {
        const m = new DatosWhodrug();
        const rowMap: Record<string, string> = {};

        columnNames.forEach((col, index) => {
          rowMap[col] = (index < splitStr.length) ? splitStr[index].trim() : "";
        });

        // Mapeo dinámico basado en los nombres de columna (Case Insensitive)
        for (const [col, val] of Object.entries(rowMap)) {
          const lowerCol = col.toLowerCase();
          if (lowerCol === 'drugcode') m.drugCode = val;
          else if (lowerCol === 'drugname') m.drugName = val;
          else if (lowerCol === 'medicinalproductid') m.medicinalProductID = val;
          else if (lowerCol === 'atcs') m.atcs = val;
          else if (lowerCol === 'abbreviation') m.abbreviation = val;
          else if (lowerCol === 'ingredient') m.ingredient = val;
          else if (lowerCol === 'ingredienttranslations') m.ingredientTranslations = val;
          else if (lowerCol === 'languagecode') m.languageCode = val;
          else if (lowerCol === 'iso3code') m.iso3Code = val;
          else if (lowerCol === 'country_medicinalproductid') m.countryMedicinalProductID = val;
          else if (lowerCol === 'maholders') m.maHolders = val;
          else if (lowerCol === 'maholders_medicinalproductid') m.maHoldersmedicinalProductID = val;
          else if (lowerCol === 'form') m.form = val;
          else if (lowerCol === 'formtranslations') m.formTranslations = val;
          else if (lowerCol === 'forms_medicinalproductid') m.formsmedicinalProductID = val;
          else if (lowerCol === 'strength') m.strength = val;
          else if (lowerCol === 'strengths_medicinalproductid') m.strengthsmedicinalProductID = val;
          else if (lowerCol === 'isgeneric') m.isGeneric = val;
          else if (lowerCol === 'ispreferred' || lowerCol === 'isv') m.isV = val;
          else if (lowerCol === 'id') m.medicinalProductID = val; // El ID en Java se manejaba specially
        }

        await this.whoDrugRepo.agregaActualizaWhodrug(m);
      } catch (e) {
        console.log(`Problem with line in WhoDrug file: ${line}`);
      }
    }
  }
}
