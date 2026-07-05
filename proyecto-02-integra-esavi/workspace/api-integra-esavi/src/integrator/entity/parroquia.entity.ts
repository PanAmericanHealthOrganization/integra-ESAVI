import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Canton } from './canton.entity';

@Entity({
  schema: 'DHI_ESAVI',
  name: 'TC_DPA_PARROQUIA',
  comment: 'Catálogo de parroquias del Ecuador',
})
export class Parroquia extends Auditoria {
  @PrimaryColumn({
    name: 'CODIGO',
    length: 6,
    comment: 'Código INEC de la parroquia (6 dígitos)',
  })
  codigo: string;

  @Column({
    name: 'NOMBRE',
    length: 100,
    nullable: false,
    comment: 'Nombre de la parroquia',
  })
  nombre: string;

  @ManyToOne(() => Canton, (canton) => canton.parroquias, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'CANTON_CODIGO', referencedColumnName: 'codigo' })
  canton: Canton;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
  }
}
