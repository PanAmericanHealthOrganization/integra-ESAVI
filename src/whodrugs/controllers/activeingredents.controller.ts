import { Controller, Get, HttpException, HttpStatus, Param } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ActiveIngredientsService } from '../services/activeIngredients.service';
import { ActiveIngredient } from '../models/activeIngredient.entity';
/**
 *
 */
@ApiTags('Who Drug')
@Controller({ path: 'whodrug/:drugId/activeingredents', version: '1' })
export class ActiveIngredientController {
  constructor(private readonly activeIngredentService: ActiveIngredientsService) {}
  /**
   *
   * @param drugId
   * @param isoCoutry
   * @returns
   */
  @Get('/')
  @ApiBody({
    description: 'Obtiene los activeIngredents de un producto de medicamentos',
  })
  public async getActiveIngredentsByProductId(
    @Param('drugId') drugId: string,
  ): Promise<ActiveIngredient[]> {
    if (!drugId) {
      throw new HttpException("drugId can't be empty", HttpStatus.BAD_REQUEST);
    }
    
    return await this.activeIngredentService.getActiveIngredentsOfDrug(drugId);
  }
}
