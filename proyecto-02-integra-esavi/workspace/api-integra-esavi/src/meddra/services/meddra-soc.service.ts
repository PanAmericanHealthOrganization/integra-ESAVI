import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SOC } from '../models/standar/soc.entity';

/**
 *
 */
@Injectable()
export class MeddraSocService {
  //
  constructor(
    @InjectRepository(SOC, 'meddra')
    private readonly socRepository: Repository<SOC>,
  ) {}
  //
  private readonly logger = new Logger(MeddraSocService.name);

  /**
   * Searches for a SOC entity by its name or abbreviation, case-insensitively.
   * @param term
   * @returns SOC entity if found, otherwise undefined.
   */
  async searchSOC(term: string): Promise<SOC> {
    if (!term || term.trim() === '') {
      this.logger.warn('Término de búsqueda SOC vacío o nulo');
      return null;
    }

    term = term.trim();
    const soc = await this.socRepository
      .createQueryBuilder('soc')
      .where('LOWER(soc.name) = :term', { term: (term || '').toLowerCase() })
      .orWhere('LOWER(soc.abbrev) = :term', { term: (term || '').toLowerCase() })
      .getOne();

    if (!soc) {
      this.logger.warn(`SOC no encontrado para el término: "${term}"`);
    }

    return soc;
  }
}
