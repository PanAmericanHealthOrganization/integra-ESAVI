import {Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {ILike,Repository} from 'typeorm';
import {MeddraStandarDto} from '../models/dto';
import {cie10Meddra} from '../models/mapping/cie19meddra.entity';
import {CIE10ES} from '../models/standar/cie_10_meddra.entity';
import {LLT} from '../models/standar/llt.entity';
import {PT} from '../models/standar/pt.entity';
import {SOC} from '../models/standar/soc.entity';

@Injectable()
export class MeddraStandarService {
  private readonly logger = new Logger(MeddraStandarService.name);
  private readonly SIMILITUD_MINIMA = 0.9;

  constructor(
    @InjectRepository(LLT, 'MEDDRA')
    private readonly lltRepository: Repository<LLT>,
    @InjectRepository(PT, 'MEDDRA')
    private readonly ptRepository: Repository<PT>,
    @InjectRepository(SOC, 'MEDDRA')
    private readonly socRepository: Repository<SOC>,
    @InjectRepository(cie10Meddra, 'MEDDRA')
    private readonly cie10MeddraRepository: Repository<cie10Meddra>,
    @InjectRepository(CIE10ES, 'MEDDRA')
    private readonly CIE10ESRepository: Repository<CIE10ES>,
  ) {}

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
    const s1 = a.toUpperCase();
    const s2 = b.toUpperCase();
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1;
    return (maxLen - this.levenshtein(s1, s2)) / maxLen;
  }

  async buscarLltPorSimilitud(nombre: string): Promise<cie10Meddra | null> {
    if (!nombre?.trim()) return null;
    const nombreNorm = nombre.trim().toUpperCase();
    const registros = await this.cie10MeddraRepository.find();
    this.logger.debug(`[buscarLltPorSimilitud] Buscando "${nombreNorm}" en ${registros.length} registros de MED_CIE10_TO_MED`);

    // Recopilar todos los candidatos con similitud >= 90%
    const candidatos: { reg: cie10Meddra; sim: number }[] = [];
    for (const reg of registros) {
      const sim = this.similitud(nombreNorm, (reg.meddra_llt_name ?? '').toUpperCase());
      if (sim >= this.SIMILITUD_MINIMA) {
        candidatos.push({ reg, sim });
      }
    }

    if (candidatos.length === 0) {
      this.logger.debug(`[buscarLltPorSimilitud] "${nombreNorm}" → sin coincidencias`);
      return null;
    }

    // Ordenar por mayor similitud primero
    candidatos.sort((a, b) => b.sim - a.sim);

    const mejor = candidatos[0].reg;
    this.logger.debug(`[buscarLltPorSimilitud] "${nombreNorm}" → ${(candidatos[0].sim * 100).toFixed(1)}% — ${mejor.meddra_llt_name} (código: ${mejor.meddra_llt_code})`);
    return mejor;
  }

  async getLltByCode(code: string): Promise<MeddraStandarDto> {
    const llt = await this.lltRepository.findOne({
      where: { code: ILike(code) },
    });

    const pt = await this.ptRepository.findOne({
      where: { code: ILike(llt?.ptCode) },
    });

    const soc = await this.socRepository.findOne({
      where: { code: ILike(pt?.socCode) },
    });

    const cie10Meddra = await this.cie10MeddraRepository.findOne({
      where: { meddra_llt_code: ILike(llt?.code) },
    });

    // TODO: la traducción al español del CIE-10 se consulta pero todavía no se vuelca en el DTO
    // (ver la línea comentada `meddraStandar.cie10Name` más abajo). Mientras siga así, esta
    // consulta es un viaje a la base de datos que no se aprovecha.
    const _cie10Meddraespaniol = await this.CIE10ESRepository.findOne({
      where: { icd10Code: ILike(cie10Meddra?.icd10_code) },
    });

    const meddraStandar = new MeddraStandarDto();
    meddraStandar.lltCode = llt?.code;
    meddraStandar.lltName = llt?.name;
    meddraStandar.ptCode = pt?.code;
    meddraStandar.ptName = pt?.name;
    meddraStandar.socCode = soc?.code;
    meddraStandar.socName = soc?.name;
    //meddraStandar.cie10Name = cie10Meddra?.icd10_term;
    meddraStandar.cie10Code = cie10Meddra?.icd10_code;
    meddraStandar.cie10MeddraEquivalence = cie10Meddra?.equivalence;

    return meddraStandar;
  }
}
