import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { encriptionTransformer } from '../utils/whodrug.encript';
import { AnatomicalTherapeuticChemical } from './atomicTerapeutalChemical.entity';
import { CountryOfSale } from './countryOfSale.entity';
import { DrugSync } from './drugSync.entity';
import { IDrug } from './dtos';

/**
 *
 */
@Entity({ name: 'DRUG', schema: 'WHO_DRUG' })
export class Drug extends Auditoria implements IDrug {
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
  @Column({
    name: 'DRU_NAME',
    transformer: encriptionTransformer,
  })
  drugName: string;

  /**
   *
   */
  @Column({
    name: 'DRU_CODE',
    transformer: encriptionTransformer,
  })
  drugCode: string;

  /**
   *
   */
  @Column({ name: 'DRU_MEDICINAL_PRODUCT_ID' })
  medicinalProductID: number;

  /**
   *
   */
  @Column({ name: 'DRU_IS_GENERIC' })
  isGeneric: boolean;

  /**
   *
   */
  @Column({ name: 'DRU_IS_PREFERRED' })
  isPreferred: boolean;

  /**
   *
   */
  @ManyToOne(() => DrugSync)
  @JoinColumn({ name: 'DRS_ID', referencedColumnName: 'id' })
  drugSync: DrugSync;

  /**
   *
   */
  @OneToMany(() => CountryOfSale, (cs) => cs.drug)
  countriesOfSale: CountryOfSale[];
  /**
   *
   */
  @OneToMany(() => AnatomicalTherapeuticChemical, (atc) => atc.drug)
  anatomicalTherapeuticChemical: AnatomicalTherapeuticChemical[];
}
