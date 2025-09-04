import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from '../entity/paciente.entity';

const { exec } = require('child_process');
const fs = require('fs');
const pdf = require('pdf-parse');
const pdf2base64 = require('pdf-to-base64');

// TODO: esto se debe hacer como servicio
@Injectable()
export class ReporteService {
  private readonly logger = new Logger(ReporteService.name);

  constructor(
    @InjectRepository(Paciente, 'POSTGRES_INTEGRATOR_DS')
    private readonly pacientRepository: Repository<Paciente>,
  ) {}

  pdfFilePath = `${process.env.DIR_PDF}/GACETA_ESAVI_EC_2024.pdf`; // <-- Agregada la coma
  // Función para eliminar el archivo PDF de forma forzada
  private async forceDeleteFile(
    filePath: string,
    retries = 5,
    delay = 1000,
  ): Promise<void> {
    let attempts = 0;
    return new Promise<void>((resolve, reject) => {
      const tryDelete = () => {
        try {
          if (fs.existsSync(filePath)) {
            // Si el archivo existe, intentamos eliminarlo
            fs.unlinkSync(filePath);
            console.log(`Archivo ${filePath} eliminado con éxito.`);
            resolve(); // Resolvemos cuando el archivo es eliminado
          } else {
            console.log(
              `El archivo ${filePath} no existe, no es necesario eliminarlo.`,
            );
            resolve(); // El archivo no existe, no hay nada que eliminar
          }
        } catch (error) {
          if (attempts < retries) {
            attempts++;
            console.log(
              `Intento ${attempts} fallido para eliminar el archivo ${filePath}. Reintentando...`,
            );
            setTimeout(tryDelete, delay); // Reintentar después de un intervalo
          } else {
            console.error(
              `No se pudo eliminar el archivo ${filePath} después de ${retries} intentos.`,
            );
            reject(new Error(`No se pudo eliminar el archivo ${filePath}.`));
          }
        }
      };

      tryDelete(); // Intentamos eliminar el archivo por primera vez
    });
  }

  // Función para ejecutar el comando Quarto
  private execPromise(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Quarto command errors: ${stderr}`);
          reject(new Error(`Error ejecutando el comando Quarto: ${error}`));
        }
        console.log(`Quarto command output: ${stdout}`);
        resolve(stdout);
      });
    });
  }

  // Función para crear el PDF
  async createPdf(): Promise<string> {
    try {
      // Primero intentamos eliminar el archivo PDF anterior, si existe
      await this.forceDeleteFile(this.pdfFilePath);

      // Ejecutamos el comando Quarto para generar el nuevo PDF
      console.log('Ejecutando comando Quarto para generar PDF...');
      const quartoCommand = `quarto render "${process.env.DIR_PDF}/GACETA_ESAVI_EC_2024.qmd" --to pdf`;

      // Ejecutamos el comando Quarto y esperamos que termine
      await this.execPromise(quartoCommand);

      console.log('PDF generado correctamente.');
      return 'PDF generado correctamente';
    } catch (error) {
      console.error('Error en la creación del PDF:', error);
      throw new BadRequestException('Error al generar el archivo PDF.');
    }
  }

  // Función para recuperar el PDF como base64
  async retrivePdf(fechaInicioDate, fechaFinDate): Promise<string> {
    console.log('Fechas convertidas:', fechaInicioDate, fechaFinDate);

    try {
      // Primero generamos el PDF
      console.log('Generando el PDF...');
      await this.createPdf();

      console.log('Recuperando el archivo PDF generado...');
      // Recuperamos el archivo generado y lo convertimos a base64
      const base64pdf = await this.pdfToBase64(this.pdfFilePath);
      console.log('PDF en base64:', base64pdf);

      return base64pdf;
    } catch (error) {
      console.error('Error al recuperar el archivo PDF:', error);
      throw new BadRequestException('Error al recuperar el archivo PDF.');
    }
  }

  // Función para convertir el archivo PDF a base64
  private async pdfToBase64(filePath: string): Promise<string> {
    try {
      const file = fs.readFileSync(filePath);
      return file.toString('base64');
    } catch (error) {
      console.error('Error al leer el archivo PDF:', error);
      throw new BadRequestException('Error al leer el archivo PDF.');
    }
  }

  async casosEsaviPorSexoGrave(): Promise<string> {
    const query = `select COALESCE(tc."DESCRIPCIONHOMOLOGADA", 'NO REGISTRA')  AS "sexo",
    count(*) AS "cantidad"
   from dhi_esavi."TR_PACIENTE" tp inner join
      dhi_esavi."TR_NOTIFICACION" tn on tp."PACIENTE_ID" = tn."PACIENTE_ID" inner join 
      dhi_esavi."TR_GRAVEDADESAVI" tg on tn."NOTIFICACION_ID" = tg."NOTIFICACION_ID" and tg."TIPOGRAVEDAD" = 'GRAVE' inner join
      dhi_esavi."TC_CATALOGO" tc on tp."CTSEXO_ID" = tc."CATALOGO_ID" 	 
   group by tc."DESCRIPCIONHOMOLOGADA"`;

    try {
      const results = await this.pacientRepository.query(query);
      return results;
    } catch (error) {
      throw new Error(`Failed to execute native query: ${error.message}`);
    }
  }

  async casosEsaviPorSexoNoGrave(): Promise<string> {
    const query = `select COALESCE(tc."DESCRIPCIONHOMOLOGADA", 'NO REGISTRA')  AS "sexo",
     count(*) AS "cantidad"
    from dhi_esavi."TR_PACIENTE" tp inner join
       dhi_esavi."TR_NOTIFICACION" tn on tp."PACIENTE_ID" = tn."PACIENTE_ID" inner join 
       dhi_esavi."TR_GRAVEDADESAVI" tg on tn."NOTIFICACION_ID" = tg."NOTIFICACION_ID" and tg."TIPOGRAVEDAD" <> 'GRAVE' inner join
       dhi_esavi."TC_CATALOGO" tc on tp."CTSEXO_ID" = tc."CATALOGO_ID" 	 
    group by tc."DESCRIPCIONHOMOLOGADA"`;

    try {
      const results = await this.pacientRepository.query(query);
      return results;
    } catch (error) {
      throw new Error(`Failed to execute native query: ${error.message}`);
    }
  }

  async casosEsaviPorMes(): Promise<string> {
    const query = `select to_char(tn."FECHAREPORTENACIONAL", 'yyyymm') as aniomes,  
    to_char(tn."FECHAREPORTENACIONAL", 'yyyy') as anio, 
    to_char(tn."FECHAREPORTENACIONAL", 'TMMonth') as mes, 
    tp."ORIGEN" as origen, 
    count(*) as cantidad, 
    count(tg4."NOTIFICACION_ID") as grave, 
    count(*) - count(tg4."NOTIFICACION_ID") as nograve
from dhi_esavi."TR_PACIENTE" tp inner join 
dhi_esavi."TR_NOTIFICACION" tn on tp."PACIENTE_ID" = tn."PACIENTE_ID"  inner join 
dhi_esavi."TC_CATALOGO" tc on tp."CTSEXO_ID" = tc."CATALOGO_ID" left join  
(select tg1."NOTIFICACION_ID" from  dhi_esavi."TR_GRAVEDADESAVI" tg1 where (tg1."TIPOGRAVEDAD" = 'GRAVE')) as tg4 on tg4."NOTIFICACION_ID" = tn."NOTIFICACION_ID"
where 	 to_char(tn."FECHAREPORTENACIONAL", 'yyyy') = '2021'
group by to_char(tn."FECHAREPORTENACIONAL", 'yyyymm'),  to_char(tn."FECHAREPORTENACIONAL", 'yyyy'), to_char(tn."FECHAREPORTENACIONAL", 'MM'), to_char(tn."FECHAREPORTENACIONAL", 'TMMonth'), tp."ORIGEN"
order by 1;`;

    try {
      const results = await this.pacientRepository.query(query);
      return results;
    } catch (error) {
      throw new Error(`Failed to execute native query: ${error.message}`);
    }
  }

  /**
   *
   */
  async casosCruzadosMeddra(): Promise<string> {
    const query = `SELECT
    COUNT(*) AS "total_registros",
    COUNT(CASE WHEN "CTLLTMEDDRA_ID" IS NOT NULL THEN 1 END) AS "total_llt",
    COUNT(CASE WHEN "CTPTMEDDRA_ID" IS NOT NULL THEN 1 END) AS "total_pt",
    COUNT(CASE WHEN "CTSOCMEDDRA_ID" IS NOT NULL THEN 1 END) AS "total_soc"
    FROM dhi_esavi."TR_DATOSESAVI" td `;

    try {
      const results = await this.pacientRepository.query(query);
      return results;
    } catch (error) {
      throw new Error(`Failed to execute native query: ${error.message}`);
    }
  }

  /**
   *
   */
  async casosNoCruzadosMeddra(): Promise<string> {
    const query = `SELECT
    COUNT(*) AS "total_registros",
    COUNT(CASE WHEN "CTLLTMEDDRA_ID" IS  NULL THEN 1 END) AS "total_llt",
    COUNT(CASE WHEN "CTPTMEDDRA_ID" IS  NULL THEN 1 END) AS "total_pt",
    COUNT(CASE WHEN "CTSOCMEDDRA_ID" IS  NULL THEN 1 END) AS "total_soc"
    FROM dhi_esavi."TR_DATOSESAVI" td `;

    try {
      const results = await this.pacientRepository.query(query);
      return results;
    } catch (error) {
      throw new Error(`Failed to execute native query: ${error.message}`);
    }
  }

  /**
   *
   */
  async casosCruzadosWhodrug(): Promise<string> {
    const query = `SELECT
    COUNT(*) AS "total_registros",
    COUNT(CASE WHEN "DRUGCODE"  IS not  NULL THEN 1 END) AS "total_whudrug",
    COUNT(CASE WHEN "DRUGCODE"  IS NULL THEN 1 END) AS "total_no_whudrug"
    FROM dhi_esavi."TR_DATOVACUNA" td
    where "NOTIFICACION_ID" is null `;

    try {
      const results = await this.pacientRepository.query(query);
      return results;
    } catch (error) {
      throw new Error(`Failed to execute native query: ${error.message}`);
    }
  }
}
