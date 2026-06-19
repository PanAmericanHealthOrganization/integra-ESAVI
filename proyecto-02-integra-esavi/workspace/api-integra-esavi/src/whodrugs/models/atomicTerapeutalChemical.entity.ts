import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Drug } from './drug.entity';

/**
 *
 */
@Entity({
  schema: 'WHO_DRUG',
  name: 'ATOMIC_THERAPEUTIC_CHEMICALS',
})
export class AnatomicalTherapeuticChemical extends Auditoria {
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
  @Column({ name: 'CODE', comment: 'Código el elemento' })
  code: string;

  /**
   *
   */
  @Column({ name: 'TEXT' })
  text: string;

  /**
   *
   */
  @Column({ name: 'OFFICIALFLAG' })
  officialFlag: string;

  /**
   *
   */
  @ManyToOne(() => Drug)
  @JoinColumn({
    name: 'DRU_ID',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_drug__anatomical_therapeutic_chemical',
  })
  drug: Drug;
}

export class AnatomicalTherapeuticChemicalBuilder {
  private anatomicalTherapeuticChemical: AnatomicalTherapeuticChemical;

  constructor() {
    this.anatomicalTherapeuticChemical = new AnatomicalTherapeuticChemical();
  }
  public withId(id: string): AnatomicalTherapeuticChemicalBuilder {
    this.anatomicalTherapeuticChemical.id = id;
    return this;
  }

  public withCode(code: string): AnatomicalTherapeuticChemicalBuilder {
    this.anatomicalTherapeuticChemical.code = code;
    return this;
  }

  public withText(text: string): AnatomicalTherapeuticChemicalBuilder {
    this.anatomicalTherapeuticChemical.text = text;
    return this;
  }

  public withOfficialFlag(officialFlag: string): AnatomicalTherapeuticChemicalBuilder {
    this.anatomicalTherapeuticChemical.officialFlag = officialFlag;
    return this;
  }

  public withDrug(drug: Drug): AnatomicalTherapeuticChemicalBuilder {
    this.anatomicalTherapeuticChemical.drug = drug;
    return this;
  }

  public build(): AnatomicalTherapeuticChemical {
    return this.anatomicalTherapeuticChemical;
  }
}
