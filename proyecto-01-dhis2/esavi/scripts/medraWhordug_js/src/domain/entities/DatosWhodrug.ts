import { Entity, Table, PrimaryColumn, Column } from 'typeorm';

@Entity({ name: 'datos_whodrug' })
export class DatosWhodrug {
  @PrimaryColumn({ name: 'medicinal_product_id' })
  medicinalProductID: string;

  @Column({ name: 'abbreviation', nullable: true })
  abbreviation: string;

  @Column({ name: 'drug_code', nullable: true })
  drugCode: string;

  @Column({ name: 'ma_holders_medicinal_product_id', nullable: true })
  maHoldersmedicinalProductID: string;

  @Column({ name: 'form', nullable: true })
  form: string;

  @Column({ name: 'strength', nullable: true })
  strength: string;

  // Se incluyen campos adicionales inferidos de las NamedQueries del código Java
  @Column({ name: 'country_medicinal_product_id', nullable: true })
  countryMedicinalProductID: string;
}
