import {Injectable,Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {LLT} from '../models/standar/llt.entity';
import {PT} from '../models/standar/pt.entity';
import {SOC} from '../models/standar/soc.entity';

const SIMILITUD_MINIMA = 0.9;

@Injectable()
export class MeddraLLTService {
  constructor(
    @InjectRepository(LLT, 'MEDDRA')
    private readonly lltRepository: Repository<LLT>,
  ) {}

  private readonly logger = new Logger(MeddraLLTService.name);

  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
  }

  private similitud(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return (maxLen - this.levenshtein(a, b)) / maxLen;
  }

  /**
   * Busca el LLT en MEDDRA.MED_LLT comparando NAME en mayúsculas.
   * Primero intenta coincidencia exacta; si no, aplica similitud Levenshtein >= 90%.
   */
  async buscarPorSimilitud(nombre: string): Promise<LLT | null> {
    if (!nombre?.trim()) return null;
    const nombreNorm = nombre.trim().toUpperCase();

    // 1° coincidencia exacta (más rápido)
    const exacto = await this.lltRepository
      .createQueryBuilder('llt')
      .where('UPPER(llt.name) = :nombre', { nombre: nombreNorm })
      .getOne();

    if (exacto) {
      this.logger.debug(`[LLT] "${nombreNorm}" → exacto: ${exacto.name} (${exacto.code})`);
      return exacto;
    }

    // 2° candidatos con prefijo para Levenshtein (máximo 4 chars)
    const prefijo = nombreNorm.substring(0, 4);
    const candidatos = await this.lltRepository
      .createQueryBuilder('llt')
      .where('UPPER(llt.name) LIKE :like', { like: `${prefijo}%` })
      .getMany();

    let mejorMatch: LLT | null = null;
    let mejorSim = 0;
    for (const llt of candidatos) {
      const sim = this.similitud(nombreNorm, (llt.name ?? '').toUpperCase());
      if (sim >= SIMILITUD_MINIMA && sim > mejorSim) {
        mejorSim = sim;
        mejorMatch = llt;
      }
    }

    this.logger.debug(`[LLT] "${nombreNorm}" → similitud ${(mejorSim * 100).toFixed(1)}% — código: ${mejorMatch?.code ?? 'NINGUNO'}`);
    return mejorMatch;
  }

  /**
   * Busca el código LLT en MEDDRA.MED_LLT comparando NAME en mayúsculas.
   * Primero intenta coincidencia exacta; si no, aplica similitud Levenshtein >= 90%.
   */
  async buscarCodigoPorSimilitud(nombre: string): Promise<string | null> {
    const llt = await this.buscarPorSimilitud(nombre);
    return llt?.code ?? null;
  }

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
   * Retorna el término LLT con sus ancestros PT y SOC.
   *
   * Los joins van por el **código** y no por las relaciones declaradas en las entidades.
   * `LLT.pt` se une por `ID_PT_CODE` y esa columna está vacía en las 88.985 filas del
   * diccionario: el proceso de carga sólo llena `PT_CODE`, el código en texto. Con
   * `leftJoinAndSelect('llt.pt')` el PT salía siempre en null y, con él, el SOC — de ahí
   * que la jerarquía de un evento se mostrara incompleta aunque el dato existiera.
   *
   * En PT→SOC la FK sí está poblada, pero se une igual por código para no depender de que
   * una carga futura la vuelva a dejar vacía.
   */
  async searchLltByCode(code: string): Promise<LLT> {
    if (!code || code.trim() === '') {
      this.logger.warn('Término de búsqueda LLT vacío o nulo');
      return null;
    }

    const normalized = code.trim().toLowerCase();
    const t = await this.lltRepository
      .createQueryBuilder('llt')
      .leftJoinAndMapOne('llt.pt', PT, 'pt', 'pt.code = llt.ptCode')
      .leftJoinAndMapOne('pt.soc', SOC, 'soc', 'soc.code = pt.socCode')
      .where('LOWER(llt.code) = :code', { code: normalized })
      .getOne();

    if (!t) {
      this.logger.warn(`LLT no encontrado para el código: "${code}"`);
    }
    return t;
  }
}
