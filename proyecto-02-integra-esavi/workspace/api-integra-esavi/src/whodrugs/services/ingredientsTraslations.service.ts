import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {withAuditOnCreate} from 'src/common/utils/audit.util';
import {ILike,Repository} from 'typeorm';
import {ActiveIngredient} from '../models/activeIngredient.entity';
import {ICodificacionVacunaWhodrug,IIngredientTranslation,IWhodrugVaccineMatch} from '../models/dtos';
import {SimilitudTrigramas} from '../utils/similitud-trigramas.utils';
import {IngredientTranslation} from '../models/ingredientTranslation.entity';
import {Maholder} from '../models/maholder.entity';

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
   * La columna F (principios activos) es multilínea: una vacuna combinada trae un principio
   * activo por renglón —el caso EC-ARCSA-300078439 declara seis—. Se consulta renglón a
   * renglón, en orden, y gana el primero que resuelve.
   *
   * Consecuencia a tener presente: una combinada queda codificada por uno solo de sus
   * componentes, no por el producto combinado. Es lo que permite el modelo actual, donde
   * TR_DATO_VACUNA guarda un único DRUG_CODE por fila.
   *
   * Para cada renglón se lanza una sola consulta, por principio activo. El desempate, si
   * hace falta, se resuelve en memoria sobre esas filas (ver `resolverCandidatas`): traer el
   * conjunto una vez y filtrarlo aquí evita las dos o tres consultas encadenadas que exigía
   * hacerlo en SQL, y deja el criterio de parecido a la vista en un solo sitio.
   *
   * @param principiosActivos columna F, con un principio activo por renglón
   * @param laboratorioTitular columna I, para desempatar por titular del registro
   * @param nombreMedicamento columna E, para desempatar por nombre comercial
   */
  public async buscarCodificacionVacuna(
    principiosActivos: string,
    laboratorioTitular?: string | null,
    nombreMedicamento?: string | null,
  ): Promise<ICodificacionVacunaWhodrug | null> {
    const ingredientes = IngredientTranslationService.separarPrincipiosActivos(principiosActivos);
    if (ingredientes.length === 0) return null;

    const titular = laboratorioTitular?.trim() || null;
    const nombre = nombreMedicamento?.trim() || null;

    for (const ingrediente of ingredientes) {
      const candidatas = await this.consultarPorPrincipioActivo(ingrediente);
      const codificacion = IngredientTranslationService.resolverCandidatas(candidatas, titular, nombre);
      if (codificacion) return codificacion;
    }
    return null;
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
   * Decide qué candidata aplicar, sobre las filas que devolvió la consulta.
   *
   * - Ninguna: no hay codificación.
   * - Una: es la codificación.
   * - Dos: se toma la primera.
   * - Tres o más: se afina en dos pasos.
   *     a) Se filtran por parecido del titular (columna I) por encima de 0.6. Si queda una,
   *        esa es.
   *     b) Si quedan dos o más, se vuelven a filtrar por parecido del nombre comercial
   *        (columna E) por encima de 0.7. Con dos o menos se toma la primera; con más de
   *        dos no se codifica.
   *
   * Que tres candidatas indistinguibles no codifiquen es deliberado: elegir una sería
   * inventarse el dato. La vacuna se queda con su NOMBRE_VACUNA_REPORTADO, que sigue siendo
   * homologable después.
   */
  private static resolverCandidatas(
    candidatas: ICodificacionVacunaWhodrug[],
    titular: string | null,
    nombreMedicamento: string | null,
  ): ICodificacionVacunaWhodrug | null {
    if (candidatas.length === 0) return null;
    if (candidatas.length <= 2) return candidatas[0];

    const porTitular = candidatas.filter((candidata) =>
      SimilitudTrigramas.superaUmbral(
        candidata.maHolder,
        titular,
        IngredientTranslationService.UMBRAL_SIMILITUD_TITULAR,
      ),
    );
    if (porTitular.length === 0) return null;
    if (porTitular.length === 1) return porTitular[0];

    const porNombre = porTitular.filter((candidata) =>
      SimilitudTrigramas.superaUmbral(
        candidata.drugName,
        nombreMedicamento,
        IngredientTranslationService.UMBRAL_SIMILITUD_NOMBRE,
      ),
    );
    return porNombre.length > 0 && porNombre.length <= 2 ? porNombre[0] : null;
  }

  /**
   * Trae todas las filas del diccionario para un principio activo.
   *
   * El grafo de joins es INGREDIENT_TRANSLATION → ACTIVE_INGREDIENTS → DRUG →
   * COUNTRY_SALES → MAHOLDER, expresado con las relaciones declaradas en las entidades para
   * no escribir a mano los nombres de las claves foráneas.
   *
   * La comparación es `UPPER(...) LIKE UPPER(...)` con TRIM a ambos lados, sin comodines:
   * equivale a una igualdad insensible a mayúsculas. Ojo si algún día se añaden comodines
   * al parámetro, porque `%` y `_` dentro del valor pasarían a interpretarse como tales.
   */
  private async consultarPorPrincipioActivo(ingrediente: string): Promise<ICodificacionVacunaWhodrug[]> {
    const filas = await this.ingredientTranslationRepository
      .createQueryBuilder('t')
      .distinct(true)
      .innerJoin('t.activeIngredient', 'ai')
      .innerJoin('ai.drug', 'd')
      .innerJoin('d.countriesOfSale', 'cs')
      .innerJoin('cs.maholders', 'm')
      .select('d.drugCode', 'drugCode')
      .addSelect('d.drugName', 'drugName')
      .addSelect('cs.medicinalProductID', 'medicinalProductId')
      .addSelect('m.name', 'maHolder')
      .addSelect('m.medicinalProductID', 'maHolderMedicinalProductId')
      .where('UPPER(TRIM(t.ingredient)) LIKE UPPER(TRIM(:ingrediente))', { ingrediente })
      // Orden estable: «la primera» tiene que significar siempre la misma fila. Sin ORDER BY
      // explícito, PostgreSQL puede devolverlas en cualquier secuencia y el mismo Excel se
      // codificaría distinto en cada corrida.
      .orderBy('d.drugCode', 'ASC')
      .addOrderBy('m.medicinalProductID', 'ASC')
      .getRawMany<{
        drugCode: string;
        drugName: string;
        medicinalProductId: number | null;
        maHolder: string;
        maHolderMedicinalProductId: number | null;
      }>();

    // Los dos MPID son numéricos en WHODrug y texto en TR_DATO_VACUNA. La conversión se hace
    // aquí, comprobando contra `null` y no por veracidad, para que un identificador 0 no se
    // convierta en nulo.
    return filas.map((fila) => ({
      drugCode: fila.drugCode ?? null,
      drugName: fila.drugName ?? null,
      medicinalProductId: fila.medicinalProductId != null ? String(fila.medicinalProductId) : null,
      maHolder: fila.maHolder ?? null,
      maHolderMedicinalProductId:
        fila.maHolderMedicinalProductId != null ? String(fila.maHolderMedicinalProductId) : null,
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
