import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {withAuditOnCreate} from 'src/common/utils/audit.util';
import {ILike,Repository} from 'typeorm';
import {ActiveIngredient} from '../models/activeIngredient.entity';
import {IIngredientTranslation,IWhodrugVaccineMatch} from '../models/dtos';
import {IngredientTranslation} from '../models/ingredientTranslation.entity';
import {Maholder} from '../models/maholder.entity';

@Injectable()
export class IngredientTranslationService {
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
    //DRU_NAME y DRU_CODE están cifrados en BD (encriptionTransformer), por lo que la
    //búsqueda se hace por columnas no cifradas y las lecturas via repositorio (descifra al hidratar).
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

    const drug = maholder.countrySale?.drug;
    return {
      drugCode: drug?.drugCode ?? null,
      drugName: drug?.drugName ?? null,
      medicinalProductId: maholder.countrySale?.medicinalProductID != null ? String(maholder.countrySale.medicinalProductID) : null,
      maHolder: maholder.name,
      maHolderMedicinalProductId: maholder.medicinalProductID != null ? String(maholder.medicinalProductID) : null,
    };
  }

  public async getAllTranslationsWithIds(): Promise<any[]> {
    return await this.ingredientTranslationRepository
      .createQueryBuilder('it')
      .select(['it.id', 'it.aci_id', 'it.int_languageCode', 'it.int_ingredient'])
      .getRawMany();
  }
}
