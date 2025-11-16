import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { add, endOfDay, format, startOfDay } from 'date-fns';
import { ISync } from 'src/integrator/dto/sync.dto';
import { SyncService, VacunometroService } from 'src/integrator/service';
import { Repository } from 'typeorm';
import { VacunacionNominal } from '../entity/vacunacion.entity';
@Injectable()
export class VacunacionNominalService {
  constructor(
    @InjectRepository(VacunacionNominal, 'ORACLE_VACUNACION_DS')
    private readonly vacunacionRepository: Repository<VacunacionNominal>,
    private readonly vacunometroService: VacunometroService,
    private readonly syncProcessService: SyncService,
  ) {}

  private readonly logger = new Logger(VacunacionNominalService.name);

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async procesarVacunasAgregadasCron() {
    // procesar dia anterior
    const dia = new Date();
    // procesar vacunas agregadas
    await this.procesarVacunasAgregadas(dia);
  }

  /**
   *
   * @param dia
   * @returns
   */
  async procesarVacunasAgregadas(dia: Date): Promise<void> {
    try {
      const startTime = new Date();
      // EXTRACT, extracción de datos
      const startDay = format(startOfDay(add(dia, { days: -1 })), 'yyyy-MM-dd');
      const endDay = format(endOfDay(add(dia, { days: 1 })), 'yyyy-MM-dd');

      // Ejecutar consulta consolidada directamente
      const query = `
        SELECT 
          dvcdc.FECHA_APLICACION as fecha_aplicacion,
          dvcdc.UNICODIGO as unicode,
          dvcdc.SEXO as sexo,
          dvcdc.NOMBRE_VACUNA as nombre_vacuna,
          COUNT(*) AS total
        FROM HCUE_VACUNACION_DEPURADA.DB_VACUNACION_CONSOLIDADA_DEPURADA_COVID dvcdc
        WHERE dvcdc.FECHA_APLICACION > TO_DATE('${startDay}', 'YYYY-MM-DD') AND dvcdc.FECHA_APLICACION  < TO_DATE('${endDay}', 'YYYY-MM-DD') and dvcdc.UNICODIGO IS NOT NULL
        GROUP BY 
          dvcdc.FECHA_APLICACION,
          dvcdc.UNICODIGO,
          dvcdc.SEXO,
          dvcdc.NOMBRE_VACUNA
        ORDER BY dvcdc.FECHA_APLICACION DESC
      `;
      console.log(query);

      const vacunas = await this.vacunacionRepository.query(query);
      //
      this.logger.log(`Encontradas ${vacunas.length} vacunas aplicadas para el día ${startDay}`);
      // LOAD, ALMACENAMIENTO DE LOS DATOS
      await this.vacunometroService.createMany(vacunas);

      // SYNC, registro de proceso de sincronización
      const syncProcess: ISync = {
        name: `VacunacionNominalService.procesarVacunasAgregadas ${startDay} to ${endDay}`,
        status: 'COMPLETED',
        startTime: startTime,
        endTime: new Date(),
        errorMessage: '',
        errorStack: '',
        errorTrace: '',
        createdAt: undefined,
        createdBy: '',
        updatedAt: undefined,
        updatedBy: '',
        deletedAt: undefined,
        deletedBy: '',
        isEnabled: false,
        isActive: false,
      };
      await this.syncProcessService.createSyncProcess(syncProcess);
      return;
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   *
   * @param desde
   * @param hasta
   */
  async procesarVacunasAgregadasFull(desde: Date, hasta: Date): Promise<void> {
    try {
      // recorremo el rango de fechas
      for (let fecha = desde; fecha <= hasta; fecha.setDate(fecha.getDate() + 1)) {
        await this.procesarVacunasAgregadas(fecha);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
