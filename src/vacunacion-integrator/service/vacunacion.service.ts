import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as _ from 'lodash';
import { Vacunometro } from 'src/integrator/entity';
import { VacunometroService } from 'src/integrator/service/vacunometro.service';
import { Repository } from 'typeorm';
import { VacunacionNominal } from '../entity/vacunacion';

@Injectable()
export class VacunacionService {
  constructor(
    @InjectRepository(VacunacionNominal)
    private readonly vacunacionRepository: Repository<VacunacionNominal>,
    private readonly vacunometroService: VacunometroService,
  ) {}

  private readonly logger = new Logger(VacunacionService.name);

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async procesarVacunasAgregadas(dia: Date): Promise<void> {
    try {
      const vacunas = await this.vacunacionRepository.find({
        where: { fecha_aplicacion: dia },
      });
      const vacunasAgregadas = this.procesarVacunaToVacunaAgregada(
        vacunas,
        dia,
      );
      await this.vacunometroService.createMany(vacunasAgregadas);
    } catch (error) {
      this.logger.error(error);
    }
  }

  private procesarVacunaToVacunaAgregada(
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
}
