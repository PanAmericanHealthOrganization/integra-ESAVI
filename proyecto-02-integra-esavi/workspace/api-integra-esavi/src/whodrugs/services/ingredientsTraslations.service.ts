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
import {SimilitudFabricante} from '../utils/similitud-fabricante.utils';
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

/**
 * Criterios que bastan para dar por buena una codificación. La venta en el país ya no figura
 * entre ellos porque dejó de ser un criterio de desempate: la consulta sólo trae
 * medicamentos registrados en el país del reporte, así que todas las candidatas lo cumplen y
 * ninguna se distingue por ello.
 */
const CRITERIOS_CORROBORANTES = [CRITERIO_NOMBRE, CRITERIO_TITULAR, CRITERIO_COMPOSICION];

@Injectable()
export class IngredientTranslationService {
  /**
   * Parecido mínimo (0 a 1) entre el laboratorio reportado y el titular del diccionario para
   * aceptarlo como el mismo, medido con `SimilitudFabricante`.
   *
   * Sobre los titulares reales del libro el umbral cae en una banda ancha y vacía: los pares
   * que son el mismo laboratorio puntúan de 0,75 a 1 —«Serum Institute of India Pvt. Ltd.»
   * contra «Ministerio de Salud Publica - Ecuador, Serum Institute of India» da 0,75— y los
   * que no, 0,5 o menos —«Sanofi Pasteur» contra «Sanofi aventis» da 0,5—. 0.6 parte esa
   * banda por el medio.
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
   * El universo de búsqueda son las vacunas registradas en el país del reporte, y sólo
   * ésas: un ESAVI ecuatoriano se codifica con una vacuna con registro sanitario
   * ecuatoriano. La consulta exige además que la fila traiga sus dos MPID, de modo que
   * **si se identifica el DRUG_CODE, MEDICINAL_PRODUCT_ID y MA_HOLDER_MEDI_PROD_ID
   * existen**; no hay codificación a medias.
   *
   * Antes no se filtraba por país al identificar, con el argumento de que DRU_CODE y
   * DRU_NAME son globales. El efecto era escribir un DRUG_CODE que WHODrug sólo registra en
   * otro país —BE Td y Tripvac constan sólo para SLV— dejando vacíos los dos MPID y el
   * titular. Sobre esas filas el DRUG_CODE no describía el producto que se administró en
   * Ecuador, así que se prefiere no codificar.
   *
   * La decisión sigue yendo en dos fases:
   *
   *   Fase 1 — QUÉ vacuna es, entre las registradas en el país. Una cascada de criterios que
   *   estrechan pero nunca vacían: filtrar por titular dentro de la fase dejaría fuera las
   *   filas del propio país cuando la columna I nombra a otra sociedad del grupo —Hexaxim se
   *   reporta como «Sanofi Pasteur» y en ECU figura a nombre de «Sanofi aventis»—.
   *
   *   Fase 2 — CON QUÉ registro sanitario. Entre las filas del medicamento identificado —una
   *   por titular— gana la del titular más parecido al reportado, y de ella salen
   *   MEDICINAL_PRODUCT_ID, MA_HOLDER y MA_HOLDER_MEDI_PROD_ID.
   *
   * Cuando el diccionario no permite identificar sin ambigüedad una vacuna registrada en el
   * país, no se codifica nada: ni DRUG_CODE ni DRUG_NAME. La vacuna conserva su
   * NOMBRE_VACUNA_REPORTADO, que sigue siendo homologable después.
   *
   * @param principiosActivos columna F, con un principio activo por renglón
   * @param laboratorioTitular columna I, titular del registro
   * @param nombreMedicamento columna E, nombre comercial (patente-WHODrug)
   * @param pais país de registro al que se limita la búsqueda y del que salen los
   *             identificadores de registro (ISO 3166-1 alfa-3)
   */
  public async buscarCodificacionVacuna(
    principiosActivos: string,
    laboratorioTitular?: string | null,
    nombreMedicamento?: string | null,
    pais = 'ECU',
  ): Promise<ICodificacionVacunaWhodrugDetallada | null> {
    const ingredientes = IngredientTranslationService.separarPrincipiosActivos(principiosActivos);
    if (ingredientes.length === 0) return null;

    const filas = await this.consultarPorPrincipiosActivos(ingredientes, pais);
    if (filas.length === 0) return null;

    const titular = laboratorioTitular?.trim() || null;
    const nombre = nombreMedicamento?.trim() || null;

    const identificado = IngredientTranslationService.identificarMedicamento(
      filas,
      titular,
      nombre,
      ingredientes.length,
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
   * Fase 1: decidir de qué medicamento se trata, entre los registrados en el país.
   *
   * El país no se comprueba aquí: `consultarPorPrincipiosActivos` ya sólo devuelve filas del
   * país del reporte, así que todas las candidatas están registradas allí.
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
   * confirma. Cuánta evidencia hace falta depende de la composición: si es exacta, ella
   * sola identifica el producto; si sólo se cubre en parte, se exige además el titular.
   * Al final, si aún empatan varios medicamentos distintos, no se codifica:
   * elegir uno sería inventarse el dato, y la vacuna conserva su NOMBRE_VACUNA_REPORTADO,
   * que sigue siendo homologable después.
   */
  private static identificarMedicamento(
    filas: FilaCandidata[],
    titular: string | null,
    nombreMedicamento: string | null,
    principiosReportados: number,
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
        SimilitudFabricante.superaUmbral(
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
    const composicionExacta = exactas.length > 0;
    if (composicionExacta) {
      candidatas = exactas;
      criterios.push(CRITERIO_COMPOSICION);
    } else {
      const maxima = Math.max(...candidatas.map((fila) => fila.cobertura));
      candidatas = candidatas.filter((fila) => fila.cobertura === maxima);
      criterios.push(`cobertura ${maxima}/${principiosReportados}`);
    }

    const codigos = [...new Set(candidatas.map((fila) => fila.drugCode))];
    if (codigos.length !== 1) return null;

    // Sin ningún criterio corroborante, lo único que sostiene la elección es una cobertura
    // parcial de principios activos, que por sí sola empareja cualquier vacuna que comparta
    // un componente con la reportada. No basta para escribir un DRUG_CODE.
    const corroborada = criterios.some((criterio) => CRITERIOS_CORROBORANTES.includes(criterio));
    if (!corroborada) return null;

    // Y si la composición sólo se cubre en parte, el nombre tampoco basta: hace falta el
    // titular. Las vacunas del programa ampliado se reportan con descripciones genéricas
    // —«Diphtheria, Tetanus, Pertussis, Hepatitis B and Haemophilus Influenzae type b
    // conjugate vaccine adsorbed»— que se parecen entre fabricantes distintos, así que el
    // nombre empareja la penta de un laboratorio con la de otro y MA_HOLDER acaba
    // contradiciendo al notificador. Con la composición exacta no hace falta: identifica el
    // producto por sí sola.
    //
    // Se comprueba contra las candidatas que quedan, no contra `criterios`: esa lista
    // registra qué *estrechó* la búsqueda, y un titular que coincide con la única candidata
    // no estrecha nada y no se anota, pese a corroborar tanto como el que descarta a otras.
    const titularCorrobora = candidatas.some((fila) =>
      SimilitudFabricante.superaUmbral(fila.maHolder, titular, IngredientTranslationService.UMBRAL_SIMILITUD_TITULAR),
    );
    if (!composicionExacta && !titularCorrobora) return null;

    return {
      drugCode: codigos[0],
      drugName: candidatas[0].drugName,
      cobertura: candidatas[0].cobertura,
      criterios,
    };
  }

  /**
   * Fase 2: los identificadores del registro sanitario.
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
   *
   * La fila existe siempre —el medicamento se identificó a partir de estas mismas filas, que
   * son todas del país—, pero si por lo que fuera no se encontrase, se devuelve `null` y la
   * vacuna se queda sin codificar: media codificación no vale más que ninguna.
   */
  private static resolverRegistroDelPais(
    identificado: MedicamentoIdentificado,
    filas: FilaCandidata[],
    titular: string | null,
    principiosReportados: number,
    pais: string,
  ): ICodificacionVacunaWhodrugDetallada | null {
    const registro =
      filas
        .filter((fila) => fila.drugCode === identificado.drugCode)
        .sort(
          (a, b) =>
            SimilitudFabricante.entre(b.maHolder, titular) - SimilitudFabricante.entre(a.maHolder, titular),
        )[0] ?? null;
    if (!registro) return null;

    return {
      drugCode: identificado.drugCode,
      drugName: identificado.drugName,
      medicinalProductId: registro.medicinalProductId,
      maHolder: registro.maHolder,
      maHolderMedicinalProductId: registro.maHolderMedicinalProductId,
      paisRegistro: pais,
      cobertura: identificado.cobertura,
      principiosReportados,
      criterios: identificado.criterios,
    };
  }

  /**
   * Trae, en una sola consulta, todas las filas del diccionario que cubren alguno de los
   * principios activos reportados **y están registradas en el país del reporte**.
   *
   * Ese filtro es la regla de negocio, no una optimización: las vacunas de un ESAVI
   * ecuatoriano tienen que ser vacunas registradas en Ecuador. Va acompañado de exigir que
   * la fila traiga sus dos MPID —el del país y el del titular—, con lo que ningún
   * medicamento puede identificarse sin ellos y desaparece la codificación a medias que
   * escribía DRUG_CODE dejando MEDICINAL_PRODUCT_ID y MA_HOLDER_MEDI_PROD_ID vacíos.
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
  private async consultarPorPrincipiosActivos(ingredientes: string[], pais: string): Promise<FilaCandidata[]> {
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
      // Sólo medicamentos con venta registrada en el país del reporte, y sólo filas con los
      // dos identificadores de registro presentes: son los que garantizan que una vacuna
      // identificada traiga siempre MEDICINAL_PRODUCT_ID y MA_HOLDER_MEDI_PROD_ID.
      .andWhere('cs.iso3Code = :pais', { pais })
      .andWhere('cs.medicinalProductID IS NOT NULL')
      .andWhere('m.medicinalProductID IS NOT NULL')
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
