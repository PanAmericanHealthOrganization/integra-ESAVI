import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ActiveIngredient } from './activeIngredient.entity';
import { IIngredientTranslation } from './dtos';

/**
 *
 */
@Entity({
  schema: 'WHO_DRUG',
  name: 'INGREDIENT_TRANSLATION',
})
export class IngredientTranslation extends Auditoria implements IIngredientTranslation {
  constructor() {
    super();
    this.activeIngredient = new ActiveIngredient();
  }

  /**
   *
   */
  @Column({
    primary: true,
    unique: true,
    name: 'ID',
    type: 'char',
    length: 11,
    comment: 'Identificador único del registro',
  })
  id: string;

  /**
   *
   */
  @Column({ name: 'INT_LANGUAGECODE' })
  languageCode: string;

  /**
   *
   */
  @Column({ name: 'INT_INGREDIENT' })
  ingredient: string;

  /**
   *
   */
  @ManyToOne(() => ActiveIngredient)
  @JoinColumn({
    name: 'ACI_ID',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_active_Ingredient__maholder',
  })
  activeIngredient: ActiveIngredient;
}
