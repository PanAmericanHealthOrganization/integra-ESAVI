import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PT } from '../models/standar/pt.entity';

@Injectable()
export class MeddraPtService {
  constructor(
    @InjectRepository(PT, 'meddra')
    private readonly ptRepository: Repository<PT>,
  ) {}

  private readonly logger = new Logger(MeddraPtService.name);

  async listPTs(socCode: string, page: number, size: number, term?: string): Promise<{ data: PT[]; total: number }> {
    const qb = this.ptRepository.createQueryBuilder('pt').where('pt.socCode = :socCode', { socCode });
    if (term) {
      qb.andWhere('LOWER(pt.name) LIKE :term', { term: `%${term.toLowerCase()}%` });
    }
    const [data, total] = await qb.orderBy('pt.name', 'ASC').skip(page * size).take(size).getManyAndCount();
    return { data, total };
  }

  /**
   * Searches for a PT entity by its name, case-insensitively.
   * @param term
   * @returns PT entity if found, otherwise undefined.
   */
  public async searchPT(term: string): Promise<PT> {
    if (!term || term.trim() === '') {
      this.logger.warn('Término de búsqueda PT vacío o nulo');
      return null;
    }

    term = term.trim();
    const pt = await this.ptRepository
      .createQueryBuilder('pt')
      .where('LOWER(pt.name) = :term', { term: (term || '').toLowerCase() })
      .getOne();

    if (!pt) {
      this.logger.warn(`PT no encontrado para el término: "${term}"`);
    }

    return pt;
  }

  //---------------
  /**
   * Searches for a PT entity by its code, case-insensitively.
   * @param code
   * @returns PT entity if found, otherwise undefined.
   */
  public async searchPtByCode(term: string): Promise<PT> {
    if (!term || term.trim() === '') {
      this.logger.warn('Término de búsqueda PT vacío o nulo');
      return null;
    }

    term = term.trim();
    const pt = await this.ptRepository
      .createQueryBuilder('pt')
      .where('LOWER(pt.code) = :term', { term: (term || '').toLowerCase() })
      .getOne();

    if (!pt) {
      this.logger.warn(`PT no encontrado para el código: "${term}"`);
    }

    return pt;
  }
}
