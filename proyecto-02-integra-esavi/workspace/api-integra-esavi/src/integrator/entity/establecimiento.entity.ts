import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
import { CatalogoPadre } from './catalogo-padre.entity';
import { IEstablecimiento } from './interfaces/establecimiento.interface';
import { Parroquia } from './parroquia.entity';
@Entity({
  name: 'TR_ESTABLECIMIENTO',
  schema: 'DHI_ESAVI',
  comment: 'Tabla de establecimientos de salud gestionados por el ministerio de salud publica',
})
export class Establecimiento extends Auditoria implements IEstablecimiento {
  /**
   * Primary generated column of establecimiento
   */
  @PrimaryGeneratedColumn('uuid', {
    name: 'ID',
    comment: 'Identificador único del establecimiento',
  })
  id: string;

  /**
   * Unique code of the establishment
   *
   */
  @Column({
    name: 'UNI_CODIGO',
    comment: 'Código único del establecimiento',
    type: 'varchar',
    length: 10,
    unique: true,
  })
  uniCodigo: string;

  /**
   * Unique code of the establishment
   *
   */
  @Column({
    name: 'UNI_NOMBRE',
    comment: 'Nombre del establecimiento',
    type: 'varchar',
    length: 255,
  })
  uniNombre: string;

  @ManyToOne(() => Parroquia, { nullable: true })
  @JoinColumn({ name: 'PARROQUIA_CODIGO', referencedColumnName: 'codigo' })
  parroquiaResidencia: Parroquia;

  @ManyToOne(() => CatalogoPadre, { nullable: true, eager: false })
  @JoinColumn({ name: 'TIPO_ENTIDAD' })
  tipoEntidad: CatalogoPadre;

  @Column({
    name: 'UNI_DIRECCION',
    comment: 'Dirección del establecimiento',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  direccion: string;

  @Column({
    name: 'UNI_TELEFONO',
    comment: 'Teléfono del establecimiento',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  telefono: string;

  @Column({ name: 'LONGPS', comment: 'Longitud del establecimiento', type: 'float', nullable: true })
  longitudGps: number;

  @Column({ name: 'LATGPS', comment: 'Latitud del establecimiento', type: 'float', nullable: true })
  latitudGps: number;

  @Column({
    name: 'MAIL',
    comment: 'Correo electrónico del establecimiento',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  mail: string;
}
