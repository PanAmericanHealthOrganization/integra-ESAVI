import { Auditoria } from 'src/integrator/entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CountryOfSale } from './countryOfSale.entity';
/**
 *
 */
@Entity({ name: 'MAHOLDER', schema: 'WHO_DRUG' })
export class Maholder extends Auditoria {
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
    name: 'NAME',
    comment: 'Nombre del titular del registro',
    length: 512,
  })
  name: string;

  /**
   *
   */
  @Column({
    name: 'MEDICINAL_PRODUCT_ID',
    nullable: true,
    comment: 'Código del producto',
  })
  medicinalProductID: number;

  /**
   *
   */
  @ManyToOne(() => CountryOfSale)
  @JoinColumn({
    name: 'COS_ID',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_countrySale__maholder',
  })
  countrySale: CountryOfSale;
}
