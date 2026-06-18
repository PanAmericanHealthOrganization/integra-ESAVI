import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';

@Entity({
  schema: 'dhi_esavi',
  name: 'TC_CATALOGO_PADRE',
  comment: 'Catálogo padre con estructura jerárquica para valores de configuración',
})
export class CatalogoPadre extends Auditoria {
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador único PK de la tabla TC_CATALOGO_PADRE',
  })
  id: string;

  @ManyToOne(() => CatalogoPadre, { nullable: true, eager: false })
  @JoinColumn({ name: 'ID_PADRE' })
  padre: CatalogoPadre;

  @Column({
    name: 'CODIGO',
    length: 20,
    nullable: false,
    unique: true,
    comment: 'Código único del registro del catálogo',
  })
  codigo: string;

  @Column({
    name: 'NOMBRE',
    length: 100,
    nullable: false,
    comment: 'Nombre descriptivo del registro del catálogo',
  })
  nombre: string;

  @Column({
    name: 'DESCRIPCION',
    length: 512,
    nullable: true,
    comment: 'Descripción detallada del registro del catálogo',
  })
  descripcion: string;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
  }
}
