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
      const startTime = new Date();
      // EXTRACT, extracción de datos

      // Ejecutar consulta consolidada directamente
      const query = `
        SELECT
          r.FECHAVACUNACION AS FECHA_APLICACION,
          LPAD(r.ENTIDAD_ID, 6, '0') AS UNICODIGO,
          UPPER(v.NOMBREVACUNA) AS NOMBRE_VACUNA,
          v.DOSIS AS DOSIS,
          COUNT(CASE WHEN p2.CTSEXO_ID = 17 THEN 1 END) AS TOTAL_HOMBRES,
          COUNT(CASE WHEN p2.CTSEXO_ID = 16 THEN 1 END) AS TOTAL_MUJERES,
          COUNT(*) AS TOTAL_REGISTROS
        FROM
          HCUE_AMED.REGISTROVACUNACION r
        INNER JOIN HCUE_AMED.ESQUEMAVACUNACION e ON
          e.ID = r.ESQUEMAVACUNACION_ID
        INNER JOIN HCUE_AMED.VACUNA v ON
          v.ID = e.VACUNA_ID
        INNER JOIN HCUE_AMED.PACIENTE p ON
          p.ID = r.PACIENTE_ID
        INNER JOIN HCUE_SISTEMA.PERSONA p2 ON
          p2.ID = p.PERSONA_ID
        WHERE
          r.FECHAVACUNACION >= TO_DATE('${format(desde, 'yyyy-MM-dd')}', 'YYYY-MM-DD') 
          AND r.FECHAVACUNACION <= TO_DATE('${format(hasta, 'yyyy-MM-dd')}', 'YYYY-MM-DD')
          AND p2.CTSEXO_ID IN (17, 16)
          AND LENGTH(TRIM(v.NOMBREVACUNA)) > 0
        GROUP BY
          r.FECHAVACUNACION,
          r.ENTIDAD_ID,
          v.DOSIS,
          v.NOMBREVACUNA
        ORDER BY
          r.FECHAVACUNACION
      `;
      const vacunas = await this.oracleDataSource.query(query);
      //
      this.logger.log(
        `Encontradas ${vacunas.length} registro, para el rango ${format(desde, 'yyyy-MM-dd')} - ${format(
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
