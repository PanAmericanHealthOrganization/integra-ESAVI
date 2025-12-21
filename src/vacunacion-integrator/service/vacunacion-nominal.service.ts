import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { add, format } from 'date-fns';
import { SyncProcess } from 'src/integrator/entity/sync.entity';
import { SyncService, VacunometroService } from 'src/integrator/service';
import { DataSource } from 'typeorm';
@Injectable()
export class VacunacionNominalService {
  constructor(
    @InjectDataSource('ORACLE_VACUNACION_DS')
    private readonly oracleDataSource: DataSource,
    private readonly vacunometroService: VacunometroService,
    private readonly syncProcessService: SyncService,
  ) {}

  private readonly logger = new Logger(VacunacionNominalService.name);

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async procesarVacunasAgregadasCron() {
    // procesar dia anterior
    const dia = add(new Date(), { days: -1 });
    // procesar vacunas agregadas
    await this.procesarVacunasAgregadas(dia, dia);
  }

  /**
   *
   * @param dia
   * @returns
   */
  async procesarVacunasAgregadas(desde: Date, hasta: Date): Promise<void> {
    try {
      const desdeStr = format(desde, 'yyyy-MM-dd');
      const hastaStr = format(hasta, 'yyyy-MM-dd');
      this.logger.log(
        `Iniciando proceso de VacunacionNominalService.procesarVacunasAgregadas para el rango ${desdeStr} - ${hastaStr}`,
      );
      const startTime = new Date();
      // EXTRACT, extracción de datos

      // Ejecutar consulta consolidada directamente
      const query = `
        WITH DatosBase AS (
              SELECT
              r.FECHAVACUNACION AS FECHA_APLICACION,
              r.ENTIDAD_ID AS UNICODIGO,
              v.NOMBREVACUNA AS NOMBRE_VACUNA,
              p2.CTSEXO_ID AS SEXO,
              FLOOR(MONTHS_BETWEEN(r.FECHAVACUNACION, p2.FECHANACIMIENTO) / 12) AS edad_anios
                FROM HCUE_AMED.REGISTROVACUNACION r
                INNER JOIN HCUE_AMED.ESQUEMAVACUNACION e ON e.ID = r.ESQUEMAVACUNACION_ID
                INNER JOIN HCUE_AMED.VACUNA v ON v.ID = e.VACUNA_ID
                INNER JOIN HCUE_AMED.PACIENTE p ON p.ID = r.PACIENTE_ID
                INNER JOIN HCUE_SISTEMA.PERSONA p2 ON p2.ID = p.PERSONA_ID
                WHERE r.FECHAVACUNACION BETWEEN TO_DATE('${desdeStr}', 'YYYY-MM-DD') 
              AND TO_DATE('${hastaStr}', 'YYYY-MM-DD')
              AND p2.FECHANACIMIENTO IS NOT NULL
          )
        SELECT
          FECHA_APLICACION,
          LPAD(TO_CHAR(UNICODIGO), 6, '0') AS UNICODIGO,
          CASE 
        WHEN edad_anios BETWEEN 0 AND 1 THEN 1
        WHEN edad_anios BETWEEN 2 AND 4 THEN 2 
        WHEN edad_anios BETWEEN 5 AND 9 THEN 3
        WHEN edad_anios BETWEEN 10 AND 14 THEN 4
        WHEN edad_anios BETWEEN 15 AND 19 THEN 5
        WHEN edad_anios BETWEEN 20 AND 64 THEN 6
        ELSE 7
          END AS grupo_etario,
          UPPER(NOMBRE_VACUNA) AS NOMBRE_VACUNA,
          SUM(CASE WHEN SEXO = 17 THEN 1 ELSE 0 END) AS TOTAL_HOMBRES,
          SUM(CASE WHEN SEXO = 16 THEN 1 ELSE 0 END) AS TOTAL_MUJERES,
          COUNT(*) AS total_registros
        FROM DatosBase
        GROUP BY
          FECHA_APLICACION ,
          UNICODIGO,
          UPPER(NOMBRE_VACUNA),
          CASE 
        WHEN edad_anios BETWEEN 0 AND 1 THEN 1
        WHEN edad_anios BETWEEN 2 AND 4 THEN 2
        WHEN edad_anios BETWEEN 5 AND 9 THEN 3
        WHEN edad_anios BETWEEN 10 AND 14 THEN 4
        WHEN edad_anios BETWEEN 15 AND 19 THEN 5
        WHEN edad_anios BETWEEN 20 AND 64 THEN 6
        ELSE 7
          END
      `;
      const vacunas = await this.oracleDataSource.query(query);
      //
      this.logger.log(
        `Encontradas ${vacunas.length} registros, para el rango ${format(desde, 'yyyy-MM-dd')} - ${format(
          hasta,
          'yyyy-MM-dd',
        )}`,
      );
      // LOAD, ALMACENAMIENTO DE LOS DATOS
      await this.vacunometroService.createMany(vacunas);

      // SYNC, registro de proceso de sincronización
      const syncProcess = new SyncProcess();
      syncProcess.name = `VacunacionNominalService.procesarVacunasAgregadas ${format(desde, 'yyyy-MM-dd')} to ${format(
        hasta,
        'yyyy-MM-dd',
      )}`;
      syncProcess.status = 'COMPLETED';
      syncProcess.startTime = startTime;
      syncProcess.endTime = new Date();
      syncProcess.errorMessage = '';
      syncProcess.errorStack = '';
      syncProcess.errorTrace = '';

      // Auditoría: si no tienes usuario real, usa 'SYSTEM'
      syncProcess.createdBy = 'SYSTEM';
      syncProcess.createdAt = new Date();
      syncProcess.isEnabled = true;
      syncProcess.isActive = true;

      await this.syncProcessService.createSyncProcess(syncProcess);
      return;
    } catch (error) {
      this.logger.error(error);
    }
  }
}
