import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum IntegrationGroup {
  DHIS2 = 'DHIS2',
  VIGIFLOW = 'VIGIFLOW',
  HL7FIRE = 'HL7FIRE',
}

@Entity({ schema: 'dhi_esavi' , name: 'TC_PARAMETRO' })
export class Parametro {
  @PrimaryGeneratedColumn('uuid', { name: 'PARAMETRO_ID' })
  id: string;
  @Column({
    name: 'CLAVE',
    nullable: false,
    unique: true,
    length: 32,
  })
  clave: string;
  @Column({ name: 'VALOR', type: 'text', nullable: true })
  valor: string;
  @Column({
    name: 'DESCRIPCION',
    nullable: true,
    length: 512,
  })
  descripcion: string;
}
