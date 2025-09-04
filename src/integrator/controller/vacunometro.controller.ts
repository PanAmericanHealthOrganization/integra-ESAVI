import { Controller, Get } from '@nestjs/common';
import { VacunometroService } from '../service';

@Controller({ path: 'vacunometro' })
export class VacunometroController {
  constructor(private readonly vacunometroService: VacunometroService) {}
  /**
   *
   * @returns
   */
  @Get('/all')
  async getAll() {
    return this.vacunometroService.findAll();
  }
}
