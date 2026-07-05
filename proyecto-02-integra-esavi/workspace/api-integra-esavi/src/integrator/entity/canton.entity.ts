import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { Parroquia } from './parroquia.entity';
import { Provincia } from './provincia.entity';

@Entity({
  schema: 'DHI_ESAVI',
  name: 'TC_DPA_CANTON',
  comment: 'Catálogo de cantones del Ecuador',
})
export class Canton extends Auditoria {
  @PrimaryColumn({
    name: 'CODIGO',
    length: 4,
    comment: 'Código INEC del cantón (4 dígitos)',
  })
  codigo: string;

  @Column({
    name: 'NOMBRE',
    length: 100,
    nullable: false,
    comment: 'Nombre del cantón',
  })
  nombre: string;

  @ManyToOne(() => Provincia, (provincia) => provincia.cantones, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'PROVINCIA_CODIGO', referencedColumnName: 'codigo' })
  provincia: Provincia;

  @OneToMany(() => Parroquia, (parroquia) => parroquia.canton)
  parroquias: Parroquia[];

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
  }
}
