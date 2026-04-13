import {Injectable,Logger} from '@nestjs/common';
import {VacunacionNominalService} from './vacunacion-nominal.service';

/**
 *
 */
@Injectable()
export class BulkVacunacionService {
  constructor(private readonly vacunacionNominalService: VacunacionNominalService) {}
  private readonly logger = new Logger(VacunacionNominalService.name);

  /**
   * 
   */
  async bulkVacunas() {
    const start = new Date('2021-01-01');

    do {
      const end = new Date(start);
      end.setMonth(end.getMonth() + 6);
      await this.vacunacionNominalService.procesarVacunasAgregadas(start, end);
      this.logger.log(`Bulk Vacunas procesadas desde ${start.toISOString()} hasta ${end.toISOString()}`);
      start.setMonth(start.getMonth() + 6);
    } while (start < new Date());
  }
}
