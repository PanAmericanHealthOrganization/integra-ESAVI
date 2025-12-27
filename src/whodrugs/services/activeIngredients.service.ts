import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { ActiveIngredient } from '../models/activeIngredient.entity';
import { Drug } from '../models/drug.entity';
import { IActiveIngredient, IDrugResponse } from '../models/dtos/drug.dto';
import { IngredientTranslationService } from './ingredientsTraslations.service';
import { withAuditOnCreate } from 'src/common/utils/audit.util';

@Injectable()
export class ActiveIngredientsService {
  constructor(
    public readonly ingredientTranslationService: IngredientTranslationService,

    @InjectRepository(ActiveIngredient, 'who_drug')
    private readonly activeIngredientsRepository: Repository<ActiveIngredient>,
  ) {}

  public async getActiveIngredients(): Promise<ActiveIngredient[]> {
    return await this.activeIngredientsRepository.find();
  }

  public async disableLastActiveIngredient(): Promise<UpdateResult> {
    // disable last
    return this.activeIngredientsRepository
      .createQueryBuilder()
      .update()
      .set({
        isActive: false,
        isEnabled: false,
      })
      .where('isActive = :isActive', { isActive: true })
      .execute();
    // create new
  }

  private getActiveIngredientsFromDrug(drugResponse: IDrugResponse[]): ActiveIngredient[] {
    const activeIngredients = drugResponse[0].activeIngredients;
    if (activeIngredients) {
      return activeIngredients.map((activeIngredient) => {
        const activeIngredientEntity = new ActiveIngredient();
        activeIngredientEntity.ingredient = activeIngredient.ingredient;
        return activeIngredientEntity;
      });
    }

    return null;
  }

  public async syncActiveIngredient(activeIngredients: IActiveIngredient[], drugSaved: Drug) {
    if (activeIngredients.length > 0) {
      for (const activeIngredient of activeIngredients) {
        let activeIngredientEntity = new ActiveIngredient();
        activeIngredientEntity.ingredient = activeIngredient.ingredient || '';
        activeIngredientEntity.drug = drugSaved;
        activeIngredientEntity = await this.activeIngredientsRepository.save(
          withAuditOnCreate(activeIngredientEntity),
        );
        await this.ingredientTranslationService.syncIngredientTraslations(
          activeIngredient.ingredientTranslations || [],
          activeIngredientEntity,
        );
      }
    }
  }

  public async getActiveIngredentsOfDrug(drugId: string): Promise<ActiveIngredient[]> {
    const r = await this.activeIngredientsRepository.find({
      select: { id: true, ingredient: true },
      where: {
        drug: { id: drugId }, // Compara el id de la entidad relacionada 'drug'
      },
    });
    console.log(r);
    return r;
  }
  public async getIngredientTranslation(activeIngredientId: string, languageCode: string): Promise<string | null> {
    return await this.ingredientTranslationService.getTranslation(activeIngredientId, languageCode);
  }
}
