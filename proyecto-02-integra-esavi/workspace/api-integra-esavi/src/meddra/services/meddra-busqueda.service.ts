import {Injectable,Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {In,Repository} from 'typeorm';
import {LLT} from '../models/standar/llt.entity';
import {PT} from '../models/standar/pt.entity';
import {SOC} from '../models/standar/soc.entity';

/** Nivel de la jerarquía MedDRA en el que se produjo la coincidencia. */
export type NivelMeddra = 'SOC' | 'PT' | 'LLT';

export interface ISocResumen {
  code: string;
  name: string;
  abbrev: string;
}

export interface IPtResumen {
  code: string;
  name: string;
  socCode: string;
}

export interface ILltResumen {
  code: string;
  name: string;
  ptCode: string;
  currency: string;
}

/**
 * Una coincidencia junto con su camino completo hasta la raíz, para que el cliente pueda
 * pintar el árbol SOC → PT → LLT ya expandido hasta el elemento encontrado sin tener que
 * resolver los ancestros con peticiones adicionales.
 *
 * Los ancestros pueden venir en `null` si el diccionario tiene filas huérfanas (un PT cuyo
 * SOC_CODE no existe en MED_SOC, por ejemplo): la coincidencia se devuelve igual.
 */
export interface ICoincidenciaMeddra {
  nivel: NivelMeddra;
  soc: ISocResumen | null;
  pt: IPtResumen | null;
  llt: ILltResumen | null;
}

export interface IResultadoBusquedaMeddra {
  data: ICoincidenciaMeddra[];
  total: number;
  totalPorNivel: { soc: number; pt: number; llt: number };
}

/** Tramo de un segmento que cae dentro de la ventana global de paginación. */
interface ITramo {
  skip: number;
  take: number;
}

@Injectable()
export class MeddraBusquedaService {
  constructor(
    @InjectRepository(SOC, 'MEDDRA')
    private readonly socRepository: Repository<SOC>,
    @InjectRepository(PT, 'MEDDRA')
    private readonly ptRepository: Repository<PT>,
    @InjectRepository(LLT, 'MEDDRA')
    private readonly lltRepository: Repository<LLT>,
  ) {}

  private readonly logger = new Logger(MeddraBusquedaService.name);

  /**
   * Busca un término en los tres niveles del estándar a la vez, tanto por código como por
   * nombre (y por abreviatura en SOC), y devuelve cada coincidencia con su camino hasta la
   * raíz. El resultado se ordena por nivel (SOC, luego PT, luego LLT) y dentro de cada nivel
   * por nombre, de modo que la paginación sea estable entre peticiones.
   *
   * @param term Texto libre; los comodines de LIKE que traiga se tratan como literales.
   * @param page Página solicitada, base 0.
   * @param size Cantidad de coincidencias por página.
   */
  async buscar(term: string, page: number, size: number): Promise<IResultadoBusquedaMeddra> {
    const vacio: IResultadoBusquedaMeddra = {
      data: [],
      total: 0,
      totalPorNivel: { soc: 0, pt: 0, llt: 0 },
    };

    const patron = MeddraBusquedaService.aPatronLike(term);
    if (!patron) return vacio;

    const paginaSegura = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 0;
    const tamanoSeguro = Number.isFinite(size) && size > 0 ? Math.trunc(size) : 20;

    const [totalSoc, totalPt, totalLlt] = await Promise.all([
      this.consultaSoc(patron).getCount(),
      this.consultaPt(patron).getCount(),
      this.consultaLlt(patron).getCount(),
    ]);

    const totalPorNivel = { soc: totalSoc, pt: totalPt, llt: totalLlt };
    const total = totalSoc + totalPt + totalLlt;

    const desplazamiento = paginaSegura * tamanoSeguro;
    const [tramoSoc, tramoPt, tramoLlt] = MeddraBusquedaService.repartirVentana(
      desplazamiento,
      tamanoSeguro,
      [totalSoc, totalPt, totalLlt],
    );

    // Sólo se consulta el segmento que realmente aporta filas a esta página.
    const [socs, pts, llts] = await Promise.all([
      tramoSoc.take > 0
        ? this.consultaSoc(patron).skip(tramoSoc.skip).take(tramoSoc.take).getMany()
        : Promise.resolve([] as SOC[]),
      tramoPt.take > 0
        ? this.consultaPt(patron).skip(tramoPt.skip).take(tramoPt.take).getMany()
        : Promise.resolve([] as PT[]),
      tramoLlt.take > 0
        ? this.consultaLlt(patron).skip(tramoLlt.skip).take(tramoLlt.take).getMany()
        : Promise.resolve([] as LLT[]),
    ]);

    const data = await this.resolverCaminos(socs, pts, llts);

    this.logger.debug(
      `[BUSQUEDA] "${term}" → ${total} coincidencias (SOC ${totalSoc}, PT ${totalPt}, LLT ${totalLlt})`,
    );

    return { data, total, totalPorNivel };
  }

  // ─── Consultas por nivel ──────────────────────────────────────────────────

  private consultaSoc(patron: string) {
    return this.socRepository
      .createQueryBuilder('soc')
      .where(
        'LOWER(soc.code) LIKE :patron OR LOWER(soc.name) LIKE :patron OR LOWER(soc.abbrev) LIKE :patron',
        { patron },
      )
      .orderBy('soc.name', 'ASC')
      .addOrderBy('soc.code', 'ASC');
  }

  private consultaPt(patron: string) {
    return this.ptRepository
      .createQueryBuilder('pt')
      .where('LOWER(pt.code) LIKE :patron OR LOWER(pt.name) LIKE :patron', { patron })
      .orderBy('pt.name', 'ASC')
      .addOrderBy('pt.code', 'ASC');
  }

  private consultaLlt(patron: string) {
    return this.lltRepository
      .createQueryBuilder('llt')
      .where('LOWER(llt.code) LIKE :patron OR LOWER(llt.name) LIKE :patron', { patron })
      .orderBy('llt.name', 'ASC')
      .addOrderBy('llt.code', 'ASC');
  }

  // ─── Resolución de ancestros ──────────────────────────────────────────────

  /**
   * Completa el camino de cada coincidencia. Los ancestros se traen en dos consultas por
   * lote (todos los PT y luego todos los SOC necesarios) en lugar de una por fila.
   */
  private async resolverCaminos(
    socs: SOC[],
    pts: PT[],
    llts: LLT[],
  ): Promise<ICoincidenciaMeddra[]> {
    // Los PT que hacen de padre de un LLT coincidente y que no vinieron ya en la página.
    const codigosPtFaltantes = MeddraBusquedaService.codigosUnicos(llts.map((llt) => llt.ptCode));
    const ptsPorCodigo = new Map<string, PT>();
    for (const pt of pts) if (pt.code) ptsPorCodigo.set(pt.code, pt);

    const porBuscar = codigosPtFaltantes.filter((code) => !ptsPorCodigo.has(code));
    if (porBuscar.length > 0) {
      const ptsPadre = await this.ptRepository.find({ where: { code: In(porBuscar) } });
      for (const pt of ptsPadre) if (pt.code) ptsPorCodigo.set(pt.code, pt);
    }

    // Ahora sí se conocen todos los SOC necesarios: los de los PT coincidentes y los de los
    // PT padre de los LLT coincidentes.
    const socsPorCodigo = new Map<string, SOC>();
    for (const soc of socs) if (soc.code) socsPorCodigo.set(soc.code, soc);

    const codigosSoc = MeddraBusquedaService.codigosUnicos([
      ...pts.map((pt) => pt.socCode),
      ...llts.map((llt) => ptsPorCodigo.get(llt.ptCode)?.socCode),
    ]).filter((code) => !socsPorCodigo.has(code));

    if (codigosSoc.length > 0) {
      const socsPadre = await this.socRepository.find({ where: { code: In(codigosSoc) } });
      for (const soc of socsPadre) if (soc.code) socsPorCodigo.set(soc.code, soc);
    }

    const resumenSoc = (code?: string): ISocResumen | null => {
      const soc = code ? socsPorCodigo.get(code) : undefined;
      return soc ? { code: soc.code, name: soc.name, abbrev: soc.abbrev } : null;
    };
    const resumenPt = (pt?: PT): IPtResumen | null =>
      pt ? { code: pt.code, name: pt.name, socCode: pt.socCode } : null;

    return [
      ...socs.map<ICoincidenciaMeddra>((soc) => ({
        nivel: 'SOC',
        soc: { code: soc.code, name: soc.name, abbrev: soc.abbrev },
        pt: null,
        llt: null,
      })),
      ...pts.map<ICoincidenciaMeddra>((pt) => ({
        nivel: 'PT',
        soc: resumenSoc(pt.socCode),
        pt: resumenPt(pt),
        llt: null,
      })),
      ...llts.map<ICoincidenciaMeddra>((llt) => {
        const pt = ptsPorCodigo.get(llt.ptCode);
        return {
          nivel: 'LLT',
          soc: resumenSoc(pt?.socCode),
          pt: resumenPt(pt),
          llt: {
            code: llt.code,
            name: llt.name,
            ptCode: llt.ptCode,
            currency: llt.currency,
          },
        };
      }),
    ];
  }

  // ─── Utilidades ───────────────────────────────────────────────────────────

  /**
   * Convierte el término del usuario en un patrón `%…%` en minúsculas, neutralizando los
   * comodines de LIKE (`%`, `_`) y el propio carácter de escape para que se busquen como
   * texto literal.
   *
   * @returns El patrón, o cadena vacía si el término no aporta nada que buscar.
   */
  private static aPatronLike(term: string): string {
    const limpio = (term ?? '').trim().toLowerCase();
    if (!limpio) return '';
    return `%${limpio.replace(/[\\%_]/g, (caracter) => `\\${caracter}`)}%`;
  }

  private static codigosUnicos(codigos: (string | undefined | null)[]): string[] {
    return [...new Set(codigos.filter((code): code is string => !!code))];
  }

  /**
   * Reparte una ventana global de paginación entre segmentos consecutivos. Los tres niveles
   * se consultan por separado pero se paginan como si fueran una sola lista concatenada, así
   * que hay que traducir el `desplazamiento` global al `skip`/`take` de cada segmento.
   *
   * @param desplazamiento Primer elemento global de la página, base 0.
   * @param cantidad Tamaño de la página.
   * @param totales Cantidad de elementos de cada segmento, en orden.
   */
  private static repartirVentana(
    desplazamiento: number,
    cantidad: number,
    totales: number[],
  ): ITramo[] {
    const fin = desplazamiento + cantidad;
    const tramos: ITramo[] = [];
    let inicioSegmento = 0;

    for (const total of totales) {
      const finSegmento = inicioSegmento + total;
      const desde = Math.max(desplazamiento, inicioSegmento);
      const hasta = Math.min(fin, finSegmento);
      tramos.push(
        hasta > desde ? { skip: desde - inicioSegmento, take: hasta - desde } : { skip: 0, take: 0 },
      );
      inicioSegmento = finSegmento;
    }

    return tramos;
  }
}
