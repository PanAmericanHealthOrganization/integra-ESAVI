import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { endOfDay, startOfDay } from 'date-fns';
import * as _ from 'lodash';
import { ISync } from 'src/integrator/dto/sync.dto';
import { Vacunometro } from 'src/integrator/entity';
import { SyncService, VacunometroService } from 'src/integrator/service';
import { CRUD } from 'src/utils/interfaces/baseEntity';
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
    dia.setDate(dia.getDate() - 1);
    // procesar vacunas agregadas
    await this.procesarVacunasAgregadas(dia);
  }

  async procesarVacunasAgregadas(dia: Date): Promise<void> {
    try {
      const startTime = new Date();
      // EXTRACT, extracción de datos
      const startDay = startOfDay(new Date('2021-01-01'));
      const endDay = endOfDay(dia);
      const vacunas = await this.vacunacionRepository
        .createQueryBuilder('v')
        .where(
          'v.fecha_aplicacion > :startDay AND v.fecha_aplicacion < :endDay',
          {
            startDay,
            endDay,
          },
        )
        .limit(100)

        .getMany();
      this.logger.log(
        `Encontradas ${vacunas.length} vacunas aplicadas para el día ${
          dia.toISOString().split('T')[0]
        }`,
      );

      // TRANSFORM, mutación de datos/ transformación de datos
      const vacunasAgregadas = this.procesarVacunaNominalToVacunaAgregada(
        vacunas,
        dia,
      );

      // LOAD, ALMACENAMIENTO DE LOS DATOS
      await this.vacunometroService.createMany(vacunasAgregadas);

      // SYNC, registro de proceso de sincronización
      const syncProcess: ISync = {
        name: 'VacunacionNomanalService.procesarVacunasAgregadas',
        status: 'COMPLETED',
        startTime: startTime,
        endTime: new Date(),
        errorMessage: '',
        errorStack: '',
        errorTrace: '',
        enabled: true, // or the appropriate default value
        state: true, // set appropriate value
        action: CRUD.C, // set appropriate value
        createdAt: new Date(),
        updatedAt: new Date(), // add any other required fields with default values
        actionBy: 'SCHEDULE', // or set to the appropriate user identifier
      };
      await this.syncProcessService.createSyncProcess(syncProcess);
      return;
    } catch (error) {
      this.logger.error(error);
    }
  }

  private procesarVacunaNominalToVacunaAgregada(
    vacunados: VacunacionNominal[],
    fecha: Date,
  ): Vacunometro[] {
    try {
      // Utilizar lodash para agrupar y procesar los datos
      const gruposVacunas = _.groupBy(vacunados, (vacuna) => {
        return `${vacuna.fecha_aplicacion}_${vacuna.unicodigo}_${vacuna.uni_nombre}_${vacuna.nombre_vacuna}_${vacuna.sexo}_${vacuna.lote_vacuna}`;
      });

      const vacunasAgregadas: Vacunometro[] = [];

      // Procesar cada grupo y contar
      _.forEach(gruposVacunas, (grupo) => {
        const primerElemento = grupo[0]; // Tomar el primer elemento como referencia
        const cantidad = grupo.length; // Contar elementos en el grupo

        const vacunaAgregada: Vacunometro = {
          id: '', // Se generará automáticamente
          unicode: primerElemento.unicodigo || '',
          nombreVacuna: primerElemento.nombre_vacuna || '',
          dosisAplicada: primerElemento.dosis_aplicada || 1,
          diaAplicacion: fecha.getDate(),
          mesAplicacion: fecha.getMonth() + 1,
          anioAplicacion: fecha.getFullYear(),
          fechaAplicacion: fecha,
          sexo: primerElemento.sexo || '',
          cantidad: cantidad,
        };

        vacunasAgregadas.push(vacunaAgregada);
      });

      // TODO: AGREGAR A LA TABLA DE SINCRONIZACIÓN

      this.logger.log(
        `Procesadas ${
          vacunasAgregadas.length
        } agrupaciones de vacunas para la fecha ${
          fecha.toISOString().split('T')[0]
        }`,
      );
      return vacunasAgregadas;
    } catch (error) {
      this.logger.error('Error procesando vacunas agregadas:', error);
      return [];
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
      for (
        let fecha = desde;
        fecha <= hasta;
        fecha.setDate(fecha.getDate() + 1)
      ) {
        await this.procesarVacunasAgregadas(fecha);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getVacunadosCount(): Promise<number> {
    return this.vacunacionRepository.count();
  }
}
