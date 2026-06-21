import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Auditoria } from './auditoria.entity';
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
    length: 100,
  })
  uniNombre: string;

  @ManyToOne(() => Parroquia, { nullable: true })
  @JoinColumn({ name: 'PARROQUIA_CODIGO', referencedColumnName: 'codigo' })
  parroquiaResidencia: Parroquia;

  /**
   *
  Unique code of the establishment
    */
  @Column({
    name: 'ZON_CODIGO',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'Código de la zona en la que está ubicado el establecimiento',
  })
  zonaCodigo: string;

  @Column({
    name: 'ZON_DESCRIPCION',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Descripción de la zona en la que está ubicado el establecimiento',
  })
  zonaDescripcion: string;

  @Column({
    name: 'DIS_CODIGO',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'Código del distrito en la que está ubicado el establecimiento',
  })
  distritoCodigo: string;

  @Column({
    name: 'DIS_DESCRIPCION',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Descripción del distrito en la que está ubicado el establecimiento',
  })
  distritoDescripcion: string;

  @Column({
    name: 'CIR_CODIGO',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'Código de la circunscripción en la que está ubicado el establecimiento',
  })
  circuitoCodigo: string;

  @Column({
    name: 'TIPO_ENTIDAD',
    comment: 'Tipo de entidad del establecimiento',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  tipoEntidad: string;

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
