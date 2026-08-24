import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {withAuditOnCreate} from 'src/common/utils/audit.util';
import {ILike,Repository} from 'typeorm';
import {ActiveIngredient} from '../models/activeIngredient.entity';
import {
  ICodificacionVacunaWhodrug,
  ICodificacionVacunaWhodrugDetallada,
  IIngredientTranslation,
  IWhodrugVaccineMatch,
} from '../models/dtos';
import {SimilitudTrigramas} from '../utils/similitud-trigramas.utils';
import {IngredientTranslation} from '../models/ingredientTranslation.entity';
import {Maholder} from '../models/maholder.entity';

/**
 * Una fila del diccionario: un medicamento, en un país de venta, con un titular. Es la
 * unidad sobre la que deciden las dos fases de `buscarCodificacionVacuna`, y añade a la
 * codificación los dos contadores con los que se mide la composición.
 */
interface FilaCandidata extends ICodificacionVacunaWhodrug {
  /** COUNTRY_SALES.COS_COUNTRY de esta fila. */
  paisRegistro: string;
  /** Cuántos de los principios activos reportados cubre este medicamento. */
  cobertura: number;
  /** Cuántos principios activos le atribuye el diccionario al medicamento. */
  totalIngredientes: number;
}

/** Lo que resuelve la fase 1: qué medicamento es, y con qué evidencia se decidió. */
interface MedicamentoIdentificado {
  drugCode: string;
  drugName: string;
  cobertura: number;
  criterios: string[];
}

// Etiquetas de los criterios que estrechan la búsqueda. Son constantes porque además de
// documentar la traza deciden, en `CRITERIOS_CORROBORANTES`, si la codificación se sostiene.
const CRITERIO_NOMBRE = 'nombre comercial (col E)';
const CRITERIO_TITULAR = 'laboratorio titular (col I)';
const CRITERIO_COMPOSICION = 'composición exacta';
const CRITERIO_PAIS = 'venta en el país';

/**
 * Criterios que bastan para dar por buena una codificación. `CRITERIO_PAIS` no está: que un
 * medicamento se venda en Ecuador no dice nada sobre si es el que se reportó, sólo desempata
 * entre candidatos que ya venían igualados por otra evidencia.
 */
const CRITERIOS_CORROBORANTES = [CRITERIO_NOMBRE, CRITERIO_TITULAR, CRITERIO_COMPOSICION];

@Injectable()
export class IngredientTranslationService {
  /**
   * Parecido mínimo (0 a 1) entre el laboratorio reportado y el titular del diccionario
   * para aceptarlo como el mismo. Con pg_trgm, 0.6 tolera puntuación y sufijos societarios
   * —«SK Bioscience Co., Ltd.» contra «Sk bioscience»— sin llegar a emparejar laboratorios
   * distintos que comparten una palabra genérica.
   *
   * Bajarlo hace la codificación más permisiva y más propensa a falsos positivos; subirlo,
   * al contrario. Es el único parámetro con el que se ajusta ese equilibrio.
   */
  private static readonly UMBRAL_SIMILITUD_TITULAR = 0.6;

  /**
   * Parecido mínimo entre el nombre comercial reportado (columna E) y DRUG.DRU_NAME.
   *
   * Más exigente que el del titular (0.7 frente a 0.6) porque aquí se comparan dos nombres
   * de producto, sin sufijos societarios que resten parecido. Es el filtro que separa
   * presentaciones distintas de una misma familia, y con un listón bajo dejaría de
   * separarlas.
   */
  private static readonly UMBRAL_SIMILITUD_NOMBRE = 0.7;

  constructor(
    @InjectRepository(IngredientTranslation, 'WHO_DRUG')
    private readonly ingredientTranslationRepository: Repository<IngredientTranslation>,
    @InjectRepository(Maholder, 'WHO_DRUG')
    private readonly maholderRepository: Repository<Maholder>,
  ) {}

  public async syncIngredientTraslations(
    ingredientTranslation: IIngredientTranslation[],
    activeIngredient: ActiveIngredient,
  ) {
    if (ingredientTranslation.length > 0) {
      for (const ingredient of ingredientTranslation) {
        //
        const ingredientEntity = new IngredientTranslation();
        ingredientEntity.ingredient = ingredient.ingredient;
        ingredientEntity.languageCode = ingredient.languageCode;
        ingredientEntity.activeIngredient = activeIngredient;
        //
        await this.ingredientTranslationRepository.save(withAuditOnCreate(ingredientEntity));
      }
    }
  }

  /*public async getTranslation(activeIngredientId: string, languageCode: string): Promise<string | null> {
    const result = await this.ingredientTranslationRepository
      .createQueryBuilder('it')
      .select('it.int_ingredient', 'ingredient')
      .where('it.aci_id = :activeIngredientId', { activeIngredientId })
      .andWhere('it.int_languageCode = :languageCode', { languageCode })
      .andWhere('it.AUD_HABILITADO = true')
      .andWhere('it.AUD_ESTADO = true')
      .getRawOne();
    
    return result?.ingredient || null;
  }*/
    public async getTranslation(activeIngredientId: string, languageCode: string): Promise<string | null> {
      const result = await this.ingredientTranslationRepository.findOne({
        select: {          
          id: true, ingredient: true, // Seleccionamos solo la columna necesaria
        },
        where: {
          activeIngredient: { id: activeIngredientId }, // Está entre llaves porque es una relación y es de tipo objeto 'ActiveIngredient'
          languageCode: languageCode,
          isEnabled: true,//auditoria
          isActive: true,//auditoria
        }
      });
    
      return result?.ingredient || null;
    }

  public async debugTranslations(activeIngredientId: string): Promise<any[]> {
    return await this.ingredientTranslationRepository
      .createQueryBuilder('it')
      .select(['it.int_languageCode as languageCode', 'it.int_ingredient as ingredient', 'it.aci_id as aciId'])
      .where('it.aci_id = :activeIngredientId', { activeIngredientId })
      .andWhere('it.AUD_HABILITADO = true')
      .andWhere('it.AUD_ESTADO = true')
      .getRawMany();
  }

  /**
   * Codificación WHODrug de una vacuna reportada en VigiFlow.
   *
   * La columna F es multilínea: una vacuna combinada trae un principio activo por renglón
   * —el caso EC-ARCSA-300078352, Hexaxim, declara seis—. Los renglones NO se consultan uno
   * a uno: entran juntos en una única consulta y lo que identifica al producto es el
   * conjunto. Buscarlos por separado y quedarse con el primero que resuelva desaprovecha
   * justamente la evidencia que distingue una combinada de sus componentes sueltos, y hace
   * que el resultado dependa del orden de los renglones.
   *
   * La decisión va en dos fases, porque el diccionario mezcla dos ámbitos distintos:
   *
   *   Fase 1 — QUÉ vacuna es. DRU_CODE y DRU_NAME son globales, así que aquí no se filtra
   *   por país. Filtrar antes de identificar descarta productos que existen pero que
   *   WHODrug no registra a la venta en Ecuador (BE Td y Tripvac sólo constan para SLV), y
   *   filtrar por titular puede dejar fuera las filas del propio país cuando la columna I
   *   nombra a otra sociedad del grupo —Hexaxim se reporta como «Sanofi Pasteur» y en ECU
   *   figura a nombre de «Sanofi aventis»—.
   *
   *   Fase 2 — CON QUÉ registro sanitario. MEDICINAL_PRODUCT_ID, MA_HOLDER y
   *   MA_HOLDER_MEDI_PROD_ID sí dependen del país y se toman de la fila del país pedido. Si
   *   el medicamento no se vende allí, los tres quedan en null: es preferible a copiarlos de
   *   otro país, donde describirían un registro que no es el de este reporte.
   *
   * @param principiosActivos columna F, con un principio activo por renglón
   * @param laboratorioTitular columna I, titular del registro
   * @param nombreMedicamento columna E, nombre comercial (patente-WHODrug)
   * @param pais país de venta del que salen los identificadores de registro (ISO 3166-1 alfa-3)
   */
  public async buscarCodificacionVacuna(
    principiosActivos: string,
    laboratorioTitular?: string | null,
    nombreMedicamento?: string | null,
    pais = 'ECU',
  ): Promise<ICodificacionVacunaWhodrugDetallada | null> {
    const ingredientes = IngredientTranslationService.separarPrincipiosActivos(principiosActivos);
    if (ingredientes.length === 0) return null;

    const filas = await this.consultarPorPrincipiosActivos(ingredientes);
    if (filas.length === 0) return null;

    const titular = laboratorioTitular?.trim() || null;
    const nombre = nombreMedicamento?.trim() || null;

    const identificado = IngredientTranslationService.identificarMedicamento(
      filas,
      titular,
      nombre,
      ingredientes.length,
      pais,
    );
    if (!identificado) return null;

    return IngredientTranslationService.resolverRegistroDelPais(
      identificado,
      filas,
      titular,
      ingredientes.length,
      pais,
    );
  }

  /**
   * Separa el contenido multilínea de la columna F en principios activos.
   *
   * Sólo corta por salto de línea. Deliberadamente no por coma: hay ingredientes cuyo
   * nombre la lleva —«Vacuna antitetánica, adsorbida»—, y partir por coma rompería la
   * comparación contra INT_INGREDIENT justo en esos casos.
   */
  private static separarPrincipiosActivos(valor?: string | null): string[] {
    if (!valor) return [];
    return valor
      .split(/\r?\n/)
      .map((linea) => linea.trim())
      .filter((linea) => linea !== '');
  }

  /**
   * Fase 1: decidir de qué medicamento se trata, sin mirar el país.
   *
   * Los criterios se aplican en cascada y cada uno **estrecha pero nunca vacía**: si un
   * filtro no deja ninguna candidata es que ese dato no discrimina aquí —el titular
   * reportado no se parece a ninguno del diccionario, el nombre es una descripción genérica
   * en vez de una marca— y descartarlo todo por eso perdería la codificación entera. Esa es
   * la diferencia de fondo con la estrategia anterior, que ante un filtro sin resultados
   * devolvía null.
   *
   * El orden va de la evidencia más específica a la más general: el nombre comercial
   * identifica un producto concreto, el titular acota un fabricante, y la composición
   * confirma. Al final, si aún empatan varios medicamentos distintos, no se codifica:
   * elegir uno sería inventarse el dato, y la vacuna conserva su NOMBRE_VACUNA_REPORTADO,
   * que sigue siendo homologable después.
   */
  private static identificarMedicamento(
    filas: FilaCandidata[],
    titular: string | null,
    nombreMedicamento: string | null,
    principiosReportados: number,
    pais: string,
  ): MedicamentoIdentificado | null {
    const criterios: string[] = [];

    const estrechar = (
      candidatas: FilaCandidata[],
      predicado: (fila: FilaCandidata) => boolean,
      criterio: string,
    ): FilaCandidata[] => {
      const restantes = candidatas.filter(predicado);
      if (restantes.length === 0) return candidatas;
      if (restantes.length < candidatas.length) criterios.push(criterio);
      return restantes;
    };

    let candidatas = filas;
    candidatas = estrechar(
      candidatas,
      (fila) =>
        SimilitudTrigramas.superaUmbral(
          fila.drugName,
          nombreMedicamento,
          IngredientTranslationService.UMBRAL_SIMILITUD_NOMBRE,
        ),
      CRITERIO_NOMBRE,
    );
    candidatas = estrechar(
      candidatas,
      (fila) =>
        SimilitudTrigramas.superaUmbral(
          fila.maHolder,
          titular,
          IngredientTranslationService.UMBRAL_SIMILITUD_TITULAR,
        ),
      CRITERIO_TITULAR,
    );

    // Composición exacta: el medicamento tiene justo los principios activos reportados, ni
    // más ni menos. Es lo que separa la combinada del producto que la contiene —Tetracoq
    // cubre los tres componentes de una DTP, pero además lleva polio, así que no es ella—.
    const exactas = candidatas.filter(
      (fila) => fila.cobertura === fila.totalIngredientes && fila.cobertura === principiosReportados,
    );
    if (exactas.length > 0) {
      candidatas = exactas;
      criterios.push(CRITERIO_COMPOSICION);
    } else {
      const maxima = Math.max(...candidatas.map((fila) => fila.cobertura));
      candidatas = candidatas.filter((fila) => fila.cobertura === maxima);
      criterios.push(`cobertura ${maxima}/${principiosReportados}`);
    }

    // Último desempate, sólo si todavía compiten medicamentos distintos: entre productos por
    // lo demás equivalentes, el que sí se vende en el país del reporte.
    if (new Set(candidatas.map((fila) => fila.drugCode)).size > 1) {
      candidatas = estrechar(candidatas, (fila) => fila.paisRegistro === pais, CRITERIO_PAIS);
    }

    const codigos = [...new Set(candidatas.map((fila) => fila.drugCode))];
    if (codigos.length !== 1) return null;

    // Sin ningún criterio corroborante, lo único que sostiene la elección es una cobertura
    // parcial de principios activos, que por sí sola empareja cualquier vacuna que comparta
    // un componente con la reportada. No basta para escribir un DRUG_CODE.
    const corroborada = criterios.some((criterio) => CRITERIOS_CORROBORANTES.includes(criterio));
    if (!corroborada) return null;

    return {
      drugCode: codigos[0],
      drugName: candidatas[0].drugName,
      cobertura: candidatas[0].cobertura,
      criterios,
    };
  }

  /**
   * Fase 2: los identificadores del registro sanitario, que sí dependen del país.
   *
   * Se buscan entre **todas** las filas del medicamento identificado, no sólo entre las que
   * sobrevivieron a los filtros de la fase 1. Un titular reportado que no coincide con
   * ninguno de los del país no debe dejar sin MPID a una vacuna que sí está registrada allí:
   * es el caso de Hexaxim reportado como «Sanofi Pasteur», que igualmente debe recibir el
   * registro ecuatoriano a nombre de «Sanofi aventis».
   *
   * Cuando el país tiene varios titulares para el mismo medicamento se toma el más parecido
   * al reportado. El orden de la consulta ya es estable y `sort` conserva el de los empates,
   * así que el mismo Excel produce siempre la misma fila.
   */
  private static resolverRegistroDelPais(
    identificado: MedicamentoIdentificado,
    filas: FilaCandidata[],
    titular: string | null,
    principiosReportados: number,
    pais: string,
  ): ICodificacionVacunaWhodrugDetallada {
    const registro =
      filas
        .filter((fila) => fila.drugCode === identificado.drugCode && fila.paisRegistro === pais)
        .sort(
          (a, b) =>
            SimilitudTrigramas.entre(b.maHolder, titular) - SimilitudTrigramas.entre(a.maHolder, titular),
        )[0] ?? null;

    return {
      drugCode: identificado.drugCode,
      drugName: identificado.drugName,
      medicinalProductId: registro?.medicinalProductId ?? null,
      maHolder: registro?.maHolder ?? null,
      maHolderMedicinalProductId: registro?.maHolderMedicinalProductId ?? null,
      paisRegistro: registro ? pais : null,
      cobertura: identificado.cobertura,
      principiosReportados,
      criterios: identificado.criterios,
    };
  }

  /**
   * Trae, en una sola consulta, todas las filas del diccionario que cubren alguno de los
   * principios activos reportados.
   *
   * El grafo de joins es INGREDIENT_TRANSLATION → ACTIVE_INGREDIENTS → DRUG →
   * COUNTRY_SALES → MAHOLDER, expresado con las relaciones declaradas en las entidades para
   * no escribir a mano los nombres de las claves foráneas.
   *
   * Devuelve una fila por (medicamento, país de venta, titular) y añade los dos contadores
   * con los que la fase 1 mide la composición: `cobertura`, cuántos de los principios
   * reportados cubre ese medicamento, y `totalIngredientes`, cuántos le atribuye el
   * diccionario en total. Agrupar por las columnas del país y del titular no altera la
   * cobertura, porque el join de ingredientes es independiente de esas dos tablas.
   *
   * La comparación es igualdad sobre `UPPER(TRIM(...))`, no LIKE: sin comodines ambas son
   * equivalentes, y la igualdad no corre el riesgo de que un `%` o un `_` dentro del nombre
   * de un ingrediente pase a interpretarse como patrón.
   */
  private async consultarPorPrincipiosActivos(ingredientes: string[]): Promise<FilaCandidata[]> {
    const normalizados = ingredientes.map((ingrediente) => ingrediente.trim().toUpperCase());

    const filas = await this.ingredientTranslationRepository
      .createQueryBuilder('t')
      .innerJoin('t.activeIngredient', 'ai')
      .innerJoin('ai.drug', 'd')
      .innerJoin('d.countriesOfSale', 'cs')
      .innerJoin('cs.maholders', 'm')
      .leftJoin(
        '(SELECT "DRU_ID", COUNT(*) AS total FROM "WHO_DRUG"."ACTIVE_INGREDIENTS" GROUP BY "DRU_ID")',
        'tot',
        'tot."DRU_ID" = d."ID"',
      )
      .select('d.drugCode', 'drugCode')
      .addSelect('d.drugName', 'drugName')
      .addSelect('cs.iso3Code', 'paisRegistro')
      .addSelect('cs.medicinalProductID', 'medicinalProductId')
      .addSelect('m.name', 'maHolder')
      .addSelect('m.medicinalProductID', 'maHolderMedicinalProductId')
      .addSelect('COUNT(DISTINCT UPPER(TRIM(t.ingredient)))', 'cobertura')
      // Total de principios activos del medicamento. Se toma con MAX sobre un conteo ya
      // agregado por DRU_ID, no con una subconsulta correlacionada por DRU_CODE: esa versión
      // obligaba a PostgreSQL a recorrer entera la tabla DRUG una vez por grupo —no hay
      // índice sobre DRU_CODE— y tardaba 19 s en el peor ingrediente frente a 0,4 s con esta.
      // MAX y no SUM porque DRUG trae hoy cada medicamento duplicado (258.079 filas para
      // 129.147 códigos) y ambas copias declaran los mismos principios activos: sumar los
      // contaría dos veces y ninguna composición cuadraría.
      .addSelect('MAX(tot.total)', 'totalIngredientes')
      .where('UPPER(TRIM(t.ingredient)) IN (:...ingredientes)', { ingredientes: normalizados })
      // Se agrupa por DRU_CODE y no por DRUG.ID, para que los duplicados de DRUG colapsen en
      // una sola candidata en vez de competir entre sí.
      .groupBy('d.drugCode')
      .addGroupBy('d.drugName')
      .addGroupBy('cs.iso3Code')
      .addGroupBy('cs.medicinalProductID')
      .addGroupBy('m.name')
      .addGroupBy('m.medicinalProductID')
      // Orden estable: los desempates de las dos fases tienen que resolver siempre igual.
      // Sin ORDER BY explícito PostgreSQL puede devolver las filas en cualquier secuencia y
      // el mismo Excel se codificaría distinto en cada corrida.
      .orderBy('d.drugCode', 'ASC')
      .addOrderBy('cs.iso3Code', 'ASC')
      .addOrderBy('m.medicinalProductID', 'ASC')
      .getRawMany<{
        drugCode: string;
        drugName: string;
        paisRegistro: string;
        medicinalProductId: number | null;
        maHolder: string;
        maHolderMedicinalProductId: number | null;
        cobertura: string | number;
        totalIngredientes: string | number;
      }>();

    // Los dos MPID son numéricos en WHODrug y texto en TR_DATO_VACUNA. La conversión se hace
    // aquí, comprobando contra `null` y no por veracidad, para que un identificador 0 no se
    // convierta en nulo. Los dos contadores llegan como texto porque COUNT devuelve bigint.
    return filas.map((fila) => ({
      drugCode: fila.drugCode ?? null,
      drugName: fila.drugName ?? null,
      paisRegistro: fila.paisRegistro ?? null,
      medicinalProductId: fila.medicinalProductId != null ? String(fila.medicinalProductId) : null,
      maHolder: fila.maHolder ?? null,
      maHolderMedicinalProductId:
        fila.maHolderMedicinalProductId != null ? String(fila.maHolderMedicinalProductId) : null,
      cobertura: Number(fila.cobertura),
      totalIngredientes: Number(fila.totalIngredientes),
    }));
  }

  /**
   * Busca 1 solo registro WHODrug para una vacuna, uniendo
   * INGREDIENT_TRANSLATION → ACTIVE_INGREDIENTS → DRUG → COUNTRY_SALES → MAHOLDER.
   *
   * @param ingredient nombre del principio activo (coincidencia de cadena completa, insensible a mayúsculas)
   * @param maholderName laboratorio titular del registro (coincidencia "contiene" bidireccional, insensible a
   *                     mayúsculas: el valor del Excel suele traer sufijos —"LLC", "Limited"— que WHODrug no almacena)
   * @param country país de venta en COUNTRY_SALES (ISO 3166-1 alfa-3)
   * @returns el primer match encontrado, o null si no existe
   */

  public async findVaccineByIngredientAndMaholder(
    ingredient: string,
    maholderName: string,
    country = 'ECU',
  ): Promise<IWhodrugVaccineMatch | null> {
    const ingredienteLimpio = ingredient?.trim();
    const maholderLimpio = maholderName?.trim();
    if (!ingredienteLimpio || !maholderLimpio) {
      return null;
    }

    //Paso 1: obtener los DRUG.ID cuyo principio activo tiene la traducción buscada.
    //La búsqueda arranca por el ingrediente y no por DRU_NAME porque el dato de entrada es el
    //principio activo. DRU_NAME y DRU_CODE ya no se cifran, así que también admiten filtro SQL.
    const traducciones = await this.ingredientTranslationRepository.find({
      select: { id: true, activeIngredient: { id: true, drug: { id: true } } },
      where: {
        ingredient: ILike(ingredienteLimpio),
        isEnabled: true,
        isActive: true,
      },
      relations: { activeIngredient: { drug: true } },
    });
    const drugIds = [...new Set(traducciones.map((t) => t.activeIngredient?.drug?.id).filter(Boolean))];
    if (drugIds.length === 0) {
      return null;
    }

    //Paso 2: de esos drugs, tomar el primer MAHOLDER cuyo nombre coincida con el laboratorio,
    //restringido al país de venta. La coincidencia es "contiene" bidireccional: o el nombre del
    //diccionario está contenido en el valor del Excel (caso "Merck sharp & dohme" ⊂ "Merck Sharp & Dohme LLC"),
    //o viceversa. Se usa createQueryBuilder porque el sentido "el parámetro contiene a la columna"
    //no es expresable con el operador ILike de TypeORM (solo aplica patrón del lado de la columna).
    const maholder = await this.maholderRepository
      .createQueryBuilder('m')
      .innerJoinAndSelect('m.countrySale', 'cs')
      .innerJoinAndSelect('cs.drug', 'd')
      .where('cs.iso3Code = :country', { country })
      .andWhere('d.ID IN (:...drugIds)', { drugIds })
      .andWhere(
        "(m.NAME ILIKE '%' || :maholder || '%' OR :maholder ILIKE '%' || m.NAME || '%')",
        { maholder: maholderLimpio },
      )
      .orderBy('m.ID', 'ASC')
      .limit(1)
      .getOne();
    if (!maholder) {
      return null;
    }

    // Sólo el nombre estandarizado y el titular. Este método derivaba también DRU_CODE y
    // los dos MPID (el del titular y el del país de venta); esa identificación se retiró
    // por completo a la espera de rehacerla.
    const drug = maholder.countrySale?.drug;
    return {
      drugName: drug?.drugName ?? null,
      maHolder: maholder.name,
    };
  }

  public async getAllTranslationsWithIds(): Promise<any[]> {
    return await this.ingredientTranslationRepository
      .createQueryBuilder('it')
      .select(['it.id', 'it.aci_id', 'it.int_languageCode', 'it.int_ingredient'])
      .getRawMany();
  }
}
