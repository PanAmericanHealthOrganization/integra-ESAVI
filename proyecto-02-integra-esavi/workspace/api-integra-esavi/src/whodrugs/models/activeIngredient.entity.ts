import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Drug } from './drug.entity';
import { IActiveIngredient } from './dtos';
/**
 *
 */
@Entity({ schema: 'WHO_DRUG', name: 'ACTIVE_INGREDIENTS' })
export class ActiveIngredient extends Auditoria implements IActiveIngredient {
  constructor() {
    super();
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
  @Column({ name: 'ACI_INGREDIENT', nullable: true })
  ingredient: string;

  /**
   *
   */
  @ManyToOne(() => Drug)
  @JoinColumn({ name: 'DRU_ID', referencedColumnName: 'id' })
  drug: Drug;
}

export class ActiveIngredientBuilder {
  private activeIngredient: ActiveIngredient;

  constructor() {
    this.activeIngredient = new ActiveIngredient();
  }
  public withId(id: string): ActiveIngredientBuilder {
    this.activeIngredient.id = id;
    return this;
  }

  public withIngredient(ingredient: string): ActiveIngredientBuilder {
    this.activeIngredient.ingredient = ingredient;
    return this;
  }

  public withDrug(drug: Drug): ActiveIngredientBuilder {
    this.activeIngredient.drug = drug;
    return this;
  }

  public build(): ActiveIngredient {
    return this.activeIngredient;
  }
}
