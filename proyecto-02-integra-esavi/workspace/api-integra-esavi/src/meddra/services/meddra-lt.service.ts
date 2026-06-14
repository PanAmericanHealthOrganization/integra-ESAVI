import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLT } from '../models/standar/llt.entity';

@Injectable()
export class MeddraLLTService {
  constructor(
    @InjectRepository(LLT, 'meddra')
    private readonly lltRepository: Repository<LLT>,
  ) {}

  private readonly logger = new Logger(MeddraLLTService.name);

  async listLLTs(ptCode: string, page: number, size: number): Promise<{ data: LLT[]; total: number }> {
    const [data, total] = await this.lltRepository
      .createQueryBuilder('llt')
      .where('llt.ptCode = :ptCode', { ptCode })
      .orderBy('llt.name', 'ASC')
      .skip(page * size)
      .take(size)
      .getManyAndCount();
    return { data, total };
  }

  /**
   *
   * @param term
   * @returns
   */
  async searchLLT(term: string): Promise<LLT> {
    if (!term || term.trim() === '') {
      this.logger.warn('Término de búsqueda LLT vacío o nulo');
      return null;
    }

    term = term.trim();
    const t = await this.lltRepository
      .createQueryBuilder('llt')
      .where('LOWER(llt.name) = :term', { term: (term || '').toLowerCase() }) // Comparar con el nombre normalizado
      .getOne();

    if (!t) {
      this.logger.warn(`LLT no encontrado para el término: "${term}"`);
    }
    return t;
  }

  /**
   *
   * @param code // llt code
   * @returns // Retorna el término LLT (todo el objeto) correspondiente al código proporcionado.
   */
  async searchLltByCode(code: string): Promise<LLT> {
    if (!code || code.trim() === '') {
      this.logger.warn('Término de búsqueda LLT vacío o nulo');
      return null;
    }

    code = code.trim();
    const t = await this.lltRepository
      .createQueryBuilder('llt')
      .where('LOWER(llt.code) = :code', { code: (code || '').toLowerCase() }) // Comparar con el nombre normalizado
      .getOne();

    if (!t) {
      this.logger.warn(`LLT no encontrado para el código: "${code}"`);
    }
    return t;
  }
}
