import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Drug } from './drug.entity';
import { Maholder } from './maholder.entity';

@Entity({ name: 'COUNTRY_SALES', schema: 'WHO_DRUG' })
export class CountryOfSale extends Auditoria {
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
  @Column({ name: 'COS_COUNTRY', comment: 'Pais en formato ISO iso3Code' })
  iso3Code: string;

  /**
   *
   */
  @Column({ name: 'COS_SALE', nullable: true, comment: 'Porcentaje de venta' })
  sale: number;

  /**
   *
   */
  @Column({
    name: 'COS_MEDICINAL_PRODUCT_ID',
    comment: 'Identificador del producto medico en el pais',
  })
  medicinalProductID: number;

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

  /**
   *
   */
  @OneToMany(() => Maholder, (maholder) => maholder.countrySale)
  maholders: Maholder[];
}
