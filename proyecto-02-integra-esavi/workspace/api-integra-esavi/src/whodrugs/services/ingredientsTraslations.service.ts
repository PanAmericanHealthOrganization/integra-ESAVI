import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IngredientTranslation } from '../models/ingredientTranslation.entity';
import { IIngredientTranslation } from '../models/dtos/drug.dto';
import { ActiveIngredient } from '../models/activeIngredient.entity';
import { withAuditOnCreate } from 'src/common/utils/audit.util';

@Injectable()
export class IngredientTranslationService {
  constructor(
    @InjectRepository(IngredientTranslation, 'who_drug')
    private readonly ingredientTranslationRepository: Repository<IngredientTranslation>,
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

  public async getAllTranslationsWithIds(): Promise<any[]> {
    return await this.ingredientTranslationRepository
      .createQueryBuilder('it')
      .select(['it.id', 'it.aci_id', 'it.int_languageCode', 'it.int_ingredient'])
      .getRawMany();
  }
}
