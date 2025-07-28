import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { VigiflowIntegradorService } from '../../vigiflow-integrator/service/vigiflow-integrador.service';
import * as moment from 'moment/moment';

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  // constructor(private vigiflowIntegradorService: VigiflowIntegradorService) {}
  // @Cron('0 18 * * 6')
  // handleCron() {
  //   this.logger.debug(
  //     'The process has began to retrieve information from vigiflow',
  //   );
  //   const dateFrom = moment().format('YYYY-MM-DD');
  //   const dateTo = moment().subtract(7, 'd').format('YYYY-MM-DD');
  //   this.vigiflowIntegradorService.createInBulk(
  //     new Date(dateTo),
  //     new Date(dateFrom),
  //     '',
  //   );
  //   this.logger.debug(
  //     'The process has finished to retrieve information from vigiflow',
  //   );
  // }
}
