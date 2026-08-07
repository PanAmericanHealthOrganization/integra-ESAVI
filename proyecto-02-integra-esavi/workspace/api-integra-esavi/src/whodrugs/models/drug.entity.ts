import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { AnatomicalTherapeuticChemical } from './atomicTerapeutalChemical.entity';
import { CountryOfSale } from './countryOfSale.entity';
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

  // DRU_NAME y DRU_CODE se guardaban cifradas (AES-256-CBC) con un transformer. Se retiró el
  // cifrado: son datos públicos del diccionario WHODrug —no información sensible de pacientes—
  // y cifrarlas impedía filtrar e indexar en SQL, obligando a hidratar la tabla completa en
  // memoria para cualquier búsqueda por nombre.
  @Column({ name: 'DRU_NAME' })
  drugName: string;

  /**
   *
   */
  @Column({ name: 'DRU_CODE' })
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
   * Corrida de TR_SYNC_PROCESS que cargó esta fila. Es una columna simple, sin
   * FK: TR_SYNC_PROCESS vive en el esquema DHI_ESAVI y en otro datasource de
   * TypeORM, que no puede declarar la relación aunque físicamente sea la misma
   * base. Obligatoria: toda fila del diccionario procede de una carga conocida.
   */
  @Column({
    name: 'SYNC_ID',
    type: 'uuid',
    comment: 'ID de la corrida en DHI_ESAVI.TR_SYNC_PROCESS que cargó esta fila',
  })
  syncId: string;

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
