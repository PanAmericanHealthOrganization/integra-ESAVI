import { BeforeInsert, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Canton } from './canton.entity';

@Entity({
  schema: 'DHI_ESAVI',
  name: 'TC_DPA_PROVINCIA',
  comment: 'Catálogo de provincias del Ecuador',
})
export class Provincia extends Auditoria {
  @PrimaryColumn({
    name: 'CODIGO',
    length: 2,
    comment: 'Código INEC de la provincia (2 dígitos)',
  })
  codigo: string;

  @Column({
    name: 'NOMBRE',
    length: 100,
    nullable: false,
    comment: 'Nombre de la provincia',
  })
  nombre: string;

  @OneToMany(() => Canton, (canton) => canton.provincia)
  cantones: Canton[];

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
  }
}
